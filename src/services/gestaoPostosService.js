import { supabase } from '../lib/supabase';

export const gestaoPostosService = {
    /**
     * Lista todos os postos na gestão com contagens de funcionários
     */
    async getAll(empresaId = null) {
        let query = supabase
            .from('gestao_postos')
            .select(`
                *,
                contratos (
                    id,
                    posto_trabalho,
                    empresa_id,
                    ativo,
                    empresas (id, nome_empresa)
                ),
                gestao_postos_funcionarios (
                    id,
                    tipo_lotacao,
                    deleted_at
                )
            `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        // Filtrar por empresa se necessário e calcular contagens
        let result = (data || []).map(posto => {
            const funcs = (posto.gestao_postos_funcionarios || []).filter(f => !f.deleted_at);
            return {
                ...posto,
                qtd_oficial: funcs.filter(f => f.tipo_lotacao === 'Oficial').length,
                qtd_temporaria: funcs.filter(f => f.tipo_lotacao === 'Temporaria').length,
                qtd_servico_extra: funcs.filter(f => f.tipo_lotacao === 'ServicoExtra').length,
            };
        });

        if (empresaId) {
            result = result.filter(p => p.contratos?.empresa_id === empresaId);
        }

        // Ordenar alfabeticamente pelo nome do posto
        return result.sort((a, b) =>
            (a.contratos?.posto_trabalho || '').localeCompare(b.contratos?.posto_trabalho || '')
        );
    },

    /**
     * Busca postos disponíveis para vincular (contratos ativos não vinculados)
     */
    async getPostosDisponiveis(empresaId = null) {
        // Buscar contratos ativos
        let query = supabase
            .from('contratos')
            .select('id, posto_trabalho, empresa_id, empresas(nome_empresa)')
            .eq('ativo', true)
            .is('deleted_at', null);

        if (empresaId) {
            query = query.eq('empresa_id', empresaId);
        }

        const { data: contratos, error: contratosError } = await query;
        if (contratosError) throw contratosError;

        // Buscar postos já vinculados
        const { data: vinculados, error: vinculadosError } = await supabase
            .from('gestao_postos')
            .select('contrato_id')
            .is('deleted_at', null);
        if (vinculadosError) throw vinculadosError;

        const idsVinculados = (vinculados || []).map(v => v.contrato_id);

        // Retornar apenas os não vinculados
        return (contratos || [])
            .filter(c => !idsVinculados.includes(c.id))
            .sort((a, b) => a.posto_trabalho.localeCompare(b.posto_trabalho));
    },

    /**
     * Adiciona um posto à gestão
     */
    async addPosto(contratoId) {
        const { data, error } = await supabase
            .from('gestao_postos')
            .insert({ contrato_id: contratoId })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Remove um posto da gestão (soft delete)
     */
    async deletePosto(id) {
        const { error } = await supabase
            .from('gestao_postos')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;

        // Soft delete dos funcionários vinculados
        await supabase
            .from('gestao_postos_funcionarios')
            .update({ deleted_at: new Date().toISOString() })
            .eq('gestao_posto_id', id);

        return true;
    },

    /**
     * Lista funcionários de um posto específico
     */
    async getFuncionariosByPosto(postoId) {
        const { data, error } = await supabase
            .from('gestao_postos_funcionarios')
            .select(`
                *,
                funcionarios (id, nome, empresas(nome_empresa))
            `)
            .eq('gestao_posto_id', postoId)
            .is('deleted_at', null);

        if (error) throw error;

        // Ordenar: Oficial -> Temporária -> ServicoExtra, depois alfabético
        const tipoOrder = { 'Oficial': 1, 'Temporaria': 2, 'ServicoExtra': 3 };
        return (data || []).sort((a, b) => {
            const tipoA = tipoOrder[a.tipo_lotacao] || 4;
            const tipoB = tipoOrder[b.tipo_lotacao] || 4;
            if (tipoA !== tipoB) return tipoA - tipoB;
            return (a.funcionarios?.nome || '').localeCompare(b.funcionarios?.nome || '');
        });
    },

    /**
     * Adiciona um funcionário a um posto
     */
    async addFuncionario(data) {
        // Validar duplicidade para Oficial/Temporária
        if (data.tipo_lotacao === 'Oficial' || data.tipo_lotacao === 'Temporaria') {
            const { data: existing } = await supabase
                .from('gestao_postos_funcionarios')
                .select('id')
                .eq('gestao_posto_id', data.gestao_posto_id)
                .eq('funcionario_id', data.funcionario_id)
                .in('tipo_lotacao', ['Oficial', 'Temporaria'])
                .is('deleted_at', null)
                .maybeSingle();

            if (existing) {
                throw new Error('Este funcionário já possui lotação Oficial ou Temporária neste posto.');
            }
        }

        const payload = {
            gestao_posto_id: data.gestao_posto_id,
            funcionario_id: data.funcionario_id,
            tipo_lotacao: data.tipo_lotacao,
            escala: data.escala,
            turno: data.turno
        };

        const { data: result, error } = await supabase
            .from('gestao_postos_funcionarios')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    /**
     * Atualiza um funcionário lotado
     */
    async updateFuncionario(id, data) {
        // Se mudou para Oficial/Temporária, validar duplicidade
        if (data.tipo_lotacao === 'Oficial' || data.tipo_lotacao === 'Temporaria') {
            const { data: current } = await supabase
                .from('gestao_postos_funcionarios')
                .select('gestao_posto_id, funcionario_id')
                .eq('id', id)
                .single();

            if (current) {
                const { data: existing } = await supabase
                    .from('gestao_postos_funcionarios')
                    .select('id')
                    .eq('gestao_posto_id', current.gestao_posto_id)
                    .eq('funcionario_id', current.funcionario_id)
                    .in('tipo_lotacao', ['Oficial', 'Temporaria'])
                    .is('deleted_at', null)
                    .neq('id', id)
                    .maybeSingle();

                if (existing) {
                    throw new Error('Este funcionário já possui lotação Oficial ou Temporária neste posto.');
                }
            }
        }

        const payload = {
            tipo_lotacao: data.tipo_lotacao,
            escala: data.escala,
            turno: data.turno,
            updated_at: new Date().toISOString()
        };

        const { data: result, error } = await supabase
            .from('gestao_postos_funcionarios')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    /**
     * Remove um funcionário de um posto (soft delete)
     */
    async deleteFuncionario(id) {
        const { error } = await supabase
            .from('gestao_postos_funcionarios')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    /**
     * Estatísticas para KPIs
     */
    async getStats(empresas = []) {
        const postos = await this.getAll();
        const stats = {
            total: postos.length,
            porEmpresa: {}
        };

        empresas.forEach(emp => {
            stats.porEmpresa[emp.id] = postos.filter(p => p.contratos?.empresa_id === emp.id).length;
        });

        return stats;
    }
};
