import { supabase } from '../../../../services/supabase';
import type { BeneficioCalculado } from '../types';

interface GenerateParams {
    competencia: string;
    empresa: 'FEMOG' | 'SEMOG';
}

interface FuncionarioRow {
    id: string;
    empresa: string;
    status: string;
    valor_transporte_dia: number;
    valor_combustivel_dia: number;
    cargo_id: string;
}

interface AlocacaoRow {
    funcionario_id: string;
    posto_id: string;
    he: boolean;
    funcionarios: FuncionarioRow | null;
}

interface EscalaResult {
    funcionario_id: string;
    posto_id: string;
    qnt_dias: number;
    tipo: string | null;
    dias?: unknown;
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
    // 1. Buscar Alocações dos Funcionários Ativos da Empresa
    const { data: alocacoes, error: alocError } = await supabase
        .from('alocacoes_funcionarios')
        .select(`
            funcionario_id,
            posto_id,
            he,
            funcionarios!inner(id, empresa, status, valor_transporte_dia, valor_combustivel_dia, cargo_id)
        `)
        .eq('funcionarios.status', 'ativo')
        .eq('funcionarios.empresa', empresa);

    if (alocError) throw new Error(`Erro buscando alocações: ${alocError.message}`);
    if (!alocacoes || alocacoes.length === 0) return 0; // Nenhum para gerar

    // Deduplicar funcionários ativos para processar cada um exatamente UMA vez
    const funcMap = new Map<string, { funcionario_id: string; posto_id: string; funcionarioInfo: FuncionarioRow }>();

    (alocacoes as unknown as AlocacaoRow[]).forEach(a => {
        if (!a.funcionarios) return;
        const fId = a.funcionario_id;

        if (!funcMap.has(fId)) {
            funcMap.set(fId, {
                funcionario_id: fId,
                posto_id: a.posto_id,
                funcionarioInfo: a.funcionarios
            });
        } else {
            // Dar preferência para alocação oficial (he === false) para determinar posto_id principal
            const current = funcMap.get(fId)!;
            if (a.he === false) {
                current.posto_id = a.posto_id;
            }
        }
    });

    const uniqueFuncs = Array.from(funcMap.values());
    const funcIds = uniqueFuncs.map(f => f.funcionario_id);
    const cargoIds = Array.from(new Set(uniqueFuncs.map(f => f.funcionarioInfo.cargo_id).filter(Boolean)));

    // O input string vem como YYYY-MM
    const [anoStr, mesStr] = competencia.split('-');

    // 2. Buscar Escalas em supervisao_escalas para a competência e empresa
    const { data: escalas, error: escError } = await supabase
        .from('supervisao_escalas')
        .select('funcionario_id, posto_id, qnt_dias, tipo, dias')
        .eq('competencia', competencia)
        .eq('empresa', empresa)
        .in('funcionario_id', funcIds);

    if (escError) throw new Error(`Erro nas escalas: ${escError.message}`);

    // Mapear dias trabalhados únicos por funcionário em TODOS OS POSTOS (EXCETO HE)
    const mapEscalasSet = new Map<string, Set<number>>();
    const mapEscalasCountFallback = new Map<string, number>();

    const typedEscalas = (escalas || []) as unknown as EscalaResult[];
    typedEscalas.forEach(e => {
        if (!e.funcionario_id) return;
        // EXCLUIR ESCALAS DE HORA EXTRA (HE)
        if (e.tipo === 'Extra' || e.tipo === 'HE') return;

        if (Array.isArray(e.dias) && e.dias.length > 0) {
            if (!mapEscalasSet.has(e.funcionario_id)) {
                mapEscalasSet.set(e.funcionario_id, new Set<number>());
            }
            const daySet = mapEscalasSet.get(e.funcionario_id)!;
            e.dias.forEach((d: any) => {
                if (typeof d === 'number') {
                    daySet.add(d);
                } else if (typeof d === 'object' && d !== null && 'dia' in d && typeof d.dia === 'number') {
                    daySet.add(d.dia);
                }
            });
        } else if (e.qnt_dias) {
            mapEscalasCountFallback.set(
                e.funcionario_id,
                (mapEscalasCountFallback.get(e.funcionario_id) || 0) + e.qnt_dias
            );
        }
    });

    const getDiasTrabalhar = (funcId: string): number => {
        const setDays = mapEscalasSet.get(funcId);
        if (setDays && setDays.size > 0) {
            return setDays.size;
        }
        return mapEscalasCountFallback.get(funcId) || 0;
    };

    // Determinar competência ANTERIOR para buscar faltas
    let mesAnt = parseInt(mesStr, 10) - 1;
    let anoAnt = parseInt(anoStr, 10);
    if (mesAnt === 0) {
        mesAnt = 12;
        anoAnt -= 1;
    }

    const inicioMesAnterior = new Date(anoAnt, mesAnt - 1, 1).toISOString().split('T')[0];
    const fimMesAnterior = new Date(anoAnt, mesAnt, 0).toISOString().split('T')[0];

    // 3. Buscar Dias Ausentes na competência anterior
    const { data: apontamentos, error: aptError } = await supabase
        .from('supervisao_apontamentos')
        .select('funcionario_id, beneficios_pts')
        .eq('empresa', empresa)
        .gte('data', inicioMesAnterior)
        .lte('data', fimMesAnterior)
        .in('funcionario_id', funcIds);

    if (aptError) throw new Error(`Erro nos apontamentos: ${aptError.message}`);

    // 4. Buscar Cargos/Salarios
    const { data: cargos, error: carError } = await supabase
        .from('cargos_salarios')
        .select('id, valor_aux_alim')
        .in('id', cargoIds);

    if (carError) throw new Error(`Erro nos cargos: ${carError.message}`);
    const typedCargos = cargos as unknown as CargoResult[];
    const cargosMap = new Map<string, { valor_aux_alim: number }>(
        typedCargos.map(c => [c.id, { valor_aux_alim: c.valor_aux_alim || 0 }])
    );

    // 5. Buscar Incentivos Ativos
    const { data: gratificacoes, error: gratError } = await supabase
        .from('rh_gratificacoes')
        .select('funcionario_id, incentivo_valor')
        .eq('tipo', 'Incentivo')
        .eq('status', true)
        .eq('empresa', empresa)
        .in('funcionario_id', funcIds);

    if (gratError) throw new Error(`Erro nas gratificações: ${gratError.message}`);

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

    // 6. Preparar Payload Batch
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

    uniqueFuncs.forEach(func => {
        const funcId = func.funcionario_id;

        // Pular se já tem cálculo pra essa pessoa e não queremos duplicar
        if (existSet.has(funcId)) return;

        const funcionarioInfo = func.funcionarioInfo;
        const cargoId = funcionarioInfo?.cargo_id;

        const baseAlimentacao = cargoId ? cargosMap.get(cargoId)?.valor_aux_alim || 0 : 0;
        const baseTransporte = funcionarioInfo?.valor_transporte_dia || 0;
        const baseCombustivel = funcionarioInfo?.valor_combustivel_dia || 0;

        const diasTrabalhar = getDiasTrabalhar(funcId);
        const diasAusente = mapFaltas.get(funcId) || 0;

        const absAusente = Math.abs(diasAusente);
        const totalDias = Math.max(0, diasTrabalhar - absAusente);

        const incentivoMensal = mapIncentivos.get(funcId) || 0;

        const tAlim = totalDias * baseAlimentacao;
        const tTransp = totalDias * baseTransporte;
        const tComb = totalDias * baseCombustivel;
        const tGeral = tAlim + tTransp + tComb + incentivoMensal;

        // Se total for > 0 ou dias > 0 geramos
        if (diasTrabalhar > 0 || incentivoMensal > 0) {
            payloadToInsert.push({
                competencia,
                empresa,
                posto_id: func.posto_id,
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
            });

            // Evitar duplicação dentro da mesma iteração
            existSet.add(funcId);
        }
    });

    if (payloadToInsert.length === 0) return 0;

    // 7. Inserir todos
    const { error: insertError } = await supabase
        .from('rh_beneficios_calculados')
        .insert(payloadToInsert);

    if (insertError) throw new Error(`Erro salvando relatórios: ${insertError.message}`);

    return payloadToInsert.length;
}
