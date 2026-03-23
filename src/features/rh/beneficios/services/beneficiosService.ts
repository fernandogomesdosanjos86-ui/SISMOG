import { supabase } from '../../../../services/supabase';
import type { BeneficioCalculado } from '../types';

interface GenerateParams {
    competencia: string;
    empresa: 'FEMOG' | 'SEMOG';
}

interface AlocacaoResult {
    funcionario_id: string;
    posto_id: string;
    funcionarios: {
        id: string;
        empresa: string;
        status: string;
        valor_transporte_dia: number;
        valor_combustivel_dia: number;
        cargo_id: string;
    } | null;
}

interface EscalaResult {
    funcionario_id: string;
    qnt_dias: number;
    dias?: unknown; // Complex JSON structure, using unknown for safety
}

interface ApontamentoResult {
    funcionario_id: string;
    beneficios_pts: number | null;
}

interface CargoResult {
    id: string;
    valor_aux_alim: number | null;
}

interface GratificacaoResult {
    funcionario_id: string;
    incentivo_valor: number | null;
}

export async function gerarBeneficios({ competencia, empresa }: GenerateParams) {
    // 1. Buscar Funcionarios Ativos Alocados na empresa e sem HE (he = false)
    const { data: alocacoes, error: alocError } = await supabase
        .from('alocacoes_funcionarios')
        .select(`
            funcionario_id,
            posto_id,
            funcionarios!inner(id, empresa, status, valor_transporte_dia, valor_combustivel_dia, cargo_id)
        `)
        .eq('he', false)
        .eq('funcionarios.status', 'ativo')
        .eq('funcionarios.empresa', empresa);

    if (alocError) throw new Error(`Erro buscando alocações: ${alocError.message}`);
    if (!alocacoes || alocacoes.length === 0) return 0; // Nenhum para gerar

    // O input string virá agora como YYYY-MM
    const [anoStr, mesStr] = competencia.split('-');

    // 2. Coletar IDs para buscas em massa
    const typedAlocacoes = alocacoes as unknown as AlocacaoResult[];
    const funcIds = typedAlocacoes.map(a => a.funcionario_id);
    const cargoIds = Array.from(new Set(typedAlocacoes.map(a => a.funcionarios?.cargo_id).filter(Boolean))) as string[];

    // 3. Buscar Dias Trabalhar em supervisao_escalas (competência já é YYYY-MM)
    const { data: escalas, error: escError } = await supabase
        .from('supervisao_escalas')
        .select('funcionario_id, qnt_dias')
        .eq('competencia', competencia)
        .eq('empresa', empresa)
        .in('funcionario_id', funcIds);

    if (escError) throw new Error(`Erro nas escalas: ${escError.message}`);

    // Determinar competência ANTERIOR para buscar faltas
    let mesAnt = parseInt(mesStr, 10) - 1;
    let anoAnt = parseInt(anoStr, 10);
    if (mesAnt === 0) {
        mesAnt = 12;
        anoAnt -= 1;
    }

    // Obter datas do mês ANTERIOR para buscar apontamentos
    // O Date usa mês-1 no construtor
    const inicioMesAnterior = new Date(anoAnt, mesAnt - 1, 1).toISOString().split('T')[0];
    const fimMesAnterior = new Date(anoAnt, mesAnt, 0).toISOString().split('T')[0];

    // 4. Buscar Dias Ausentes na competência anterior
    const { data: apontamentos, error: aptError } = await supabase
        .from('supervisao_apontamentos')
        .select('funcionario_id, beneficios_pts')
        .eq('empresa', empresa)
        .gte('data', inicioMesAnterior)
        .lte('data', fimMesAnterior)
        .in('funcionario_id', funcIds);

    if (aptError) throw new Error(`Erro nos apontamentos: ${aptError.message}`);

    // 5. Buscar Cargos/Salarios
    const { data: cargos, error: carError } = await supabase
        .from('cargos_salarios')
        .select('id, valor_aux_alim')
        .in('id', cargoIds);

    if (carError) throw new Error(`Erro nos cargos: ${carError.message}`);
    const typedCargos = cargos as unknown as CargoResult[];
    const cargosMap = new Map<string, { valor_aux_alim: number }>(
        typedCargos.map(c => [c.id, { valor_aux_alim: c.valor_aux_alim || 0 }])
    );

    // 6. Buscar Incentivos Ativos (ignorando a data, priorizando o status)
    const { data: gratificacoes, error: gratError } = await supabase
        .from('rh_gratificacoes')
        .select('funcionario_id, incentivo_valor')
        .eq('tipo', 'Incentivo')
        .eq('status', true)
        .eq('empresa', empresa)
        .in('funcionario_id', funcIds);

    if (gratError) throw new Error(`Erro nas gratificações: ${gratError.message}`);

    // Helper maps
    const mapEscalas = new Map<string, number>();
    const typedEscalas = escalas as unknown as EscalaResult[];
    typedEscalas.forEach(e => {
        // Se a escala em si deve descontar he, a spec pede count na tabela onde "he = false".
        // O json de 'dias' pode ter objetos ou arrays com objetos {he:...}.
        // Assumindo q 'qnt_dias' já seja o total_trabalhado base e tirando he se aplicável. 
        // A regra diz: Count na tabela supervisao_escalas (na competencia atual onde he=false)
        // Como não há coluna `he` em `supervisao_escalas` (tem em alocacoes), a query da spec
        // provavelmente se refere a contar os dias normais na coluna JSON "dias"

        // Forma simples: qnt_dias ou contar array "dias"
        let diasNormais = 0;
        if (Array.isArray(e.dias)) {
            // Se as escalas tem estrutura de array, conta os elementos:
            diasNormais = (e.dias as unknown[]).length || e.qnt_dias || 0;
        } else {
            diasNormais = e.qnt_dias || 0;
        }

        mapEscalas.set(e.funcionario_id, (mapEscalas.get(e.funcionario_id) || 0) + diasNormais);
    });

    const mapFaltas = new Map<string, number>();
    const typedApontamentos = apontamentos as unknown as ApontamentoResult[];
    typedApontamentos.forEach(a => {
        mapFaltas.set(a.funcionario_id, (mapFaltas.get(a.funcionario_id) || 0) + (a.beneficios_pts || 0));
    });

    const mapIncentivos = new Map<string, number>();
    const typedGratificacoes = gratificacoes as unknown as GratificacaoResult[];
    typedGratificacoes.forEach(g => {
        mapIncentivos.set(g.funcionario_id, (mapIncentivos.get(g.funcionario_id) || 0) + (g.incentivo_valor || 0));
    });

    // 7. Preparar Payload Batch
    type BeneficioInsert = Omit<BeneficioCalculado, 'id' | 'created_at' | 'total_dias' | 'funcionarios' | 'postos_trabalho' | 'cargos_salarios'>;
    const payloadToInsert: BeneficioInsert[] = [];

    // Busca registros já existentes na competência para evitar sobrescrever / duplicar
    const { data: existentes, error: existError } = await supabase
        .from('rh_beneficios_calculados')
        .select('funcionario_id')
        .eq('competencia', competencia)
        .eq('empresa', empresa);

    if (existError) throw new Error(`Erro buscando existentes: ${existError.message}`);
    const existSet = new Set(existentes.map(e => e.funcionario_id));

    typedAlocacoes.forEach(aloc => {
        const funcId = aloc.funcionario_id;

        // Pular se já tem cálculo pra essa pessoa e não queremos duplicar
        if (existSet.has(funcId)) return;

        const funcionarioInfo = aloc.funcionarios;
        const cargoId = funcionarioInfo?.cargo_id;

        const baseAlimentacao = cargoId ? cargosMap.get(cargoId)?.valor_aux_alim || 0 : 0;
        const baseTransporte = funcionarioInfo?.valor_transporte_dia || 0;
        const baseCombustivel = funcionarioInfo?.valor_combustivel_dia || 0;

        const diasTrabalhar = mapEscalas.get(funcId) || 0;
        const diasAusente = mapFaltas.get(funcId) || 0;

        // Regra de negocio: Total dias 
        // Como o apontamento pode vir negativo do BD, usamos Math.abs para garantir a subtração pura.
        const absAusente = Math.abs(diasAusente);
        const totalDias = Math.max(0, diasTrabalhar - absAusente);

        const incentivoMensal = mapIncentivos.get(funcId) || 0;

        const tAlim = totalDias * baseAlimentacao;
        const tTransp = totalDias * baseTransporte;
        const tComb = totalDias * baseCombustivel;
        const tGeral = tAlim + tTransp + tComb + incentivoMensal;

        // Se total for > 0 ou dias > 0 geramos (para não popular banco com tabela inteira vazia)
        if (diasTrabalhar > 0 || incentivoMensal > 0) {
            payloadToInsert.push({
                competencia,
                empresa,
                posto_id: aloc.posto_id,
                funcionario_id: funcId,
                cargo_id: cargoId,
                dias_trabalhar: diasTrabalhar,
                dias_ausente: absAusente,
                valor_alimentacao_dia: baseAlimentacao,
                valor_transporte_dia: baseTransporte,
                valor_combustivel_dia: baseCombustivel,
                valor_incentivo_mensal: incentivoMensal,
                total_alimentacao: tAlim,
                total_transporte: tTransp,
                total_combustivel: tComb,
                total_geral: tGeral
                // O total_dias é CALCULATED STORED no BD
            });
        }
    });

    if (payloadToInsert.length === 0) return 0;

    // 8. Inserir todos
    const { error: insertError } = await supabase
        .from('rh_beneficios_calculados')
        .insert(payloadToInsert);

    if (insertError) throw new Error(`Erro salvando relatórios: ${insertError.message}`);

    return payloadToInsert.length;
}
