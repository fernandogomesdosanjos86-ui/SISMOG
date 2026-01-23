import { supabase } from '../lib/supabase';
import { format, parseISO, differenceInMinutes } from 'date-fns';

/**
 * Calcula o valor do serviço extra com arredondamento especial
 * Fórmula: Valor = Duração (horas) × (Valor Diária ÷ 12)
 * Arredondamento: Se 2ª casa decimal ≥ 6, arredonda para cima
 */
const calcularValorServicoExtra = (valorDiaria, duracaoHoras) => {
    const valorHora = Number(valorDiaria) / 12; // NÃO arredondar com regra especial
    const valorTotal = duracaoHoras * valorHora;

    // Arredondamento especial apenas para o valor total
    const valorTotalArredondado = arredondarValor(valorTotal);

    return {
        valorHora: Math.round(valorHora * 100) / 100, // Apenas 2 casas decimais, sem regra especial
        valorTotal: valorTotalArredondado
    };
};

/**
 * Arredondamento especial: Se a 2ª casa decimal ≥ 6, arredonda para cima o valor inteiro
 */
const arredondarValor = (valor) => {
    const centavos = Math.round((valor * 100) % 100);
    const segundaCasa = centavos % 10;

    if (segundaCasa >= 6) {
        // Arredonda para cima na primeira casa decimal
        return Math.ceil(valor * 10) / 10;
    }
    return Math.round(valor * 100) / 100;
};

/**
 * Calcula duração em horas entre duas datas
 */
const calcularDuracaoHoras = (dataEntrada, dataSaida) => {
    const minutos = differenceInMinutes(new Date(dataSaida), new Date(dataEntrada));
    return Math.round((minutos / 60) * 100) / 100; // 2 casas decimais
};

export const servicosExtrasService = {
    /**
     * Lista todos os lançamentos com joins
     */
    async getAll() {
        const { data, error } = await supabase
            .from('servicos_extras')
            .select(`
                *,
                empresas:empresa_id(id, nome_empresa),
                contratos:contrato_id(id, posto_trabalho),
                funcionarios:funcionario_id(id, nome, empresa_id),
                cargos_salarios:cargo_id(id, cargo, uf, servico_extra_diurno_valor, servico_extra_noturno_valor)
            `)
            .is('deleted_at', null)
            .order('data_entrada', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Filtra lançamentos por competência (mês/ano da data_entrada)
     * @param competencia - formato 'YYYY-MM'
     */
    async getByCompetencia(competencia) {
        const inicioMes = `${competencia}-01T00:00:00`;
        const [ano, mes] = competencia.split('-').map(Number);
        const proximoMes = mes === 12 ? `${ano + 1}-01` : `${ano}-${String(mes + 1).padStart(2, '0')}`;
        const fimMes = `${proximoMes}-01T00:00:00`;

        const { data, error } = await supabase
            .from('servicos_extras')
            .select(`
                *,
                empresas:empresa_id(id, nome_empresa),
                contratos:contrato_id(id, posto_trabalho),
                funcionarios:funcionario_id(id, nome, empresa_id),
                cargos_salarios:cargo_id(id, cargo, uf)
            `)
            .is('deleted_at', null)
            .gte('data_entrada', inicioMes)
            .lt('data_entrada', fimMes)
            .order('data_entrada', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Agrupa lançamentos por funcionário para a listagem principal
     * @returns Array com { funcionario_id, funcionario_nome, qtd, total, lancamentos, totaisPorEmpresa }
     */
    async getAgrupadoPorFuncionario(competencia) {
        const lancamentos = await this.getByCompetencia(competencia);

        // Agrupar por funcionário
        const agrupado = {};
        lancamentos.forEach(item => {
            const funcId = item.funcionario_id;
            if (!agrupado[funcId]) {
                agrupado[funcId] = {
                    funcionario_id: funcId,
                    funcionario_nome: item.funcionarios?.nome || 'N/A',
                    funcionario_empresa_id: item.funcionarios?.empresa_id,
                    qtd: 0,
                    total: 0,
                    totaisPorEmpresa: {},
                    lancamentos: []
                };
            }

            agrupado[funcId].qtd += 1;
            agrupado[funcId].total += Number(item.valor_total);
            agrupado[funcId].lancamentos.push(item);

            // Totalizar por empresa
            const empNome = item.empresas?.nome_empresa || 'Sem Empresa';
            const empId = item.empresa_id;
            if (!agrupado[funcId].totaisPorEmpresa[empId]) {
                agrupado[funcId].totaisPorEmpresa[empId] = {
                    empresa_id: empId,
                    nome_empresa: empNome,
                    total: 0
                };
            }
            agrupado[funcId].totaisPorEmpresa[empId].total += Number(item.valor_total);
        });

        // Converter para array e ordenar alfabeticamente
        return Object.values(agrupado).sort((a, b) =>
            a.funcionario_nome.localeCompare(b.funcionario_nome)
        );
    },

    /**
     * Cria um novo lançamento com cálculo automático de valores
     */
    async create(data) {
        // Calcular duração
        const duracaoHoras = calcularDuracaoHoras(data.data_entrada, data.data_saida);

        // Buscar valor da diária do cargo
        const { data: cargo, error: cargoError } = await supabase
            .from('cargos_salarios')
            .select('servico_extra_diurno_valor, servico_extra_noturno_valor')
            .eq('id', data.cargo_id)
            .single();

        if (cargoError) throw cargoError;

        // Selecionar valor conforme turno
        const valorDiaria = data.turno === 'Diurno'
            ? cargo.servico_extra_diurno_valor
            : cargo.servico_extra_noturno_valor;

        // Calcular valores
        const { valorHora, valorTotal } = calcularValorServicoExtra(valorDiaria, duracaoHoras);

        // Payload sanitizado
        const payload = {
            empresa_id: data.empresa_id,
            contrato_id: data.contrato_id,
            funcionario_id: data.funcionario_id,
            cargo_id: data.cargo_id,
            data_entrada: data.data_entrada,
            data_saida: data.data_saida,
            turno: data.turno,
            valor_diaria: valorDiaria,
            duracao_horas: duracaoHoras,
            valor_hora: valorHora,
            valor_total: valorTotal,
            observacoes: data.observacoes || null
        };

        const { data: result, error } = await supabase
            .from('servicos_extras')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    /**
     * Atualiza um lançamento recalculando valores se necessário
     */
    async update(id, data) {
        // Se datas ou cargo/turno mudaram, recalcular
        let payload = { ...data, updated_at: new Date().toISOString() };

        // Remover objetos aninhados (joins)
        delete payload.empresas;
        delete payload.contratos;
        delete payload.funcionarios;
        delete payload.cargos_salarios;
        delete payload.id;
        delete payload.created_at;

        // Se houver data_entrada e data_saida, recalcular duração e valores
        if (data.data_entrada && data.data_saida && data.cargo_id && data.turno) {
            const duracaoHoras = calcularDuracaoHoras(data.data_entrada, data.data_saida);

            // Buscar valor da diária
            const { data: cargo } = await supabase
                .from('cargos_salarios')
                .select('servico_extra_diurno_valor, servico_extra_noturno_valor')
                .eq('id', data.cargo_id)
                .single();

            if (cargo) {
                const valorDiaria = data.turno === 'Diurno'
                    ? cargo.servico_extra_diurno_valor
                    : cargo.servico_extra_noturno_valor;

                const { valorHora, valorTotal } = calcularValorServicoExtra(valorDiaria, duracaoHoras);

                payload.duracao_horas = duracaoHoras;
                payload.valor_diaria = valorDiaria;
                payload.valor_hora = valorHora;
                payload.valor_total = valorTotal;
            }
        }

        const { data: result, error } = await supabase
            .from('servicos_extras')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    /**
     * Soft delete de um lançamento
     */
    async delete(id) {
        const { error } = await supabase
            .from('servicos_extras')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    /**
     * Remove todos os lançamentos de um funcionário em uma competência
     */
    async deleteAllByFuncionario(funcionarioId, competencia) {
        const inicioMes = `${competencia}-01T00:00:00`;
        const [ano, mes] = competencia.split('-').map(Number);
        const proximoMes = mes === 12 ? `${ano + 1}-01` : `${ano}-${String(mes + 1).padStart(2, '0')}`;
        const fimMes = `${proximoMes}-01T00:00:00`;

        const { error } = await supabase
            .from('servicos_extras')
            .update({ deleted_at: new Date().toISOString() })
            .eq('funcionario_id', funcionarioId)
            .gte('data_entrada', inicioMes)
            .lt('data_entrada', fimMes)
            .is('deleted_at', null);

        if (error) throw error;
        return true;
    },

    /**
     * Calcula totais por empresa para KPIs
     */
    calcularTotaisPorEmpresa(lancamentos, empresas) {
        const totais = { geral: 0 };

        empresas.forEach(emp => {
            totais[emp.id] = { nome: emp.nome_empresa, valor: 0 };
        });

        lancamentos.forEach(item => {
            totais.geral += Number(item.valor_total);
            if (totais[item.empresa_id]) {
                totais[item.empresa_id].valor += Number(item.valor_total);
            }
        });

        return totais;
    }
};
