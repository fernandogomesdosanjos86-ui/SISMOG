import { normalizeSearchString } from '../../../utils/normalization';
import { supabase } from '../../../services/supabase';
import type { TrocaPosto, TrocaPostoFormData } from '../types';

export const trocaPostoService = {
    async getTrocasPosto(options?: { monthYear?: string; searchTerm?: string }) {
        let query = supabase
            .from('supervisao_trocas_posto')
            .select(`
                id,
                empresa,
                funcionario_id,
                posto_original_id,
                posto_cobertura_id,
                data,
                observacoes,
                solicitante_id,
                created_at,
                updated_at,
                funcionario:funcionarios!funcionario_id(id, nome, cpf),
                posto_original:postos_trabalho!posto_original_id(id, nome, empresa),
                posto_cobertura:postos_trabalho!posto_cobertura_id(id, nome, empresa),
                solicitante:usuarios!solicitante_id(id, nome)
            `)
            .order('data', { ascending: false })
            .order('created_at', { ascending: false });

        if (options?.monthYear) {
            const startDate = `${options.monthYear}-01`;
            const year = parseInt(options.monthYear.substring(0, 4));
            const month = parseInt(options.monthYear.substring(5, 7));
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];

            query = query.gte('data', startDate).lte('data', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;

        let filteredData = (data || []) as unknown as TrocaPosto[];

        if (options?.searchTerm) {
            const term = normalizeSearchString(options.searchTerm);

            filteredData = filteredData.filter(t =>
                normalizeSearchString(t.funcionario?.nome).includes(term) ||
                normalizeSearchString(t.posto_original?.nome).includes(term) ||
                normalizeSearchString(t.posto_cobertura?.nome).includes(term) ||
                normalizeSearchString(t.observacoes || '').includes(term) ||
                normalizeSearchString(t.solicitante?.nome).includes(term)
            );
        }

        return filteredData;
    },

    async getMesesComLancamento() {
        const { data, error } = await supabase
            .from('supervisao_trocas_posto')
            .select('data');

        if (error) throw error;

        const months = new Set<string>();
        data?.forEach((t: { data: string }) => {
            if (t.data) {
                months.add(t.data.substring(0, 7));
            }
        });

        return Array.from(months).sort().reverse();
    },

    async createTrocaPosto(data: TrocaPostoFormData) {
        const { data: created, error } = await supabase
            .from('supervisao_trocas_posto')
            .insert(data as any)
            .select(`
                id,
                empresa,
                funcionario_id,
                posto_original_id,
                posto_cobertura_id,
                data,
                observacoes,
                solicitante_id,
                created_at,
                updated_at,
                funcionario:funcionarios!funcionario_id(id, nome, cpf),
                posto_original:postos_trabalho!posto_original_id(id, nome, empresa),
                posto_cobertura:postos_trabalho!posto_cobertura_id(id, nome, empresa),
                solicitante:usuarios!solicitante_id(id, nome)
            `)
            .single();

        if (error) throw error;
        return created as unknown as TrocaPosto;
    },

    async updateTrocaPosto(id: string, data: Partial<TrocaPostoFormData>) {
        const { data: updated, error } = await supabase
            .from('supervisao_trocas_posto')
            .update({
                ...data,
                updated_at: new Date().toISOString()
            } as any)
            .eq('id', id)
            .select(`
                id,
                empresa,
                funcionario_id,
                posto_original_id,
                posto_cobertura_id,
                data,
                observacoes,
                solicitante_id,
                created_at,
                updated_at,
                funcionario:funcionarios!funcionario_id(id, nome, cpf),
                posto_original:postos_trabalho!posto_original_id(id, nome, empresa),
                posto_cobertura:postos_trabalho!posto_cobertura_id(id, nome, empresa),
                solicitante:usuarios!solicitante_id(id, nome)
            `)
            .single();

        if (error) throw error;
        return updated as unknown as TrocaPosto;
    },

    async deleteTrocaPosto(id: string) {
        const { error } = await supabase
            .from('supervisao_trocas_posto')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getTrocasPostoRelatorio(filters: {
        empresa?: 'TODAS' | 'FEMOG' | 'SEMOG';
        dataInicio: string; // YYYY-MM-DD
        dataFim: string; // YYYY-MM-DD
        funcionarioId?: string;
    }) {
        let query = supabase
            .from('supervisao_trocas_posto')
            .select(`
                id,
                empresa,
                funcionario_id,
                posto_original_id,
                posto_cobertura_id,
                data,
                observacoes,
                solicitante_id,
                created_at,
                updated_at,
                funcionario:funcionarios!funcionario_id(id, nome, cpf),
                posto_original:postos_trabalho!posto_original_id(id, nome, empresa),
                posto_cobertura:postos_trabalho!posto_cobertura_id(id, nome, empresa),
                solicitante:usuarios!solicitante_id(id, nome)
            `)
            .gte('data', filters.dataInicio)
            .lte('data', filters.dataFim)
            .order('data', { ascending: true });

        if (filters.empresa && filters.empresa !== 'TODAS') {
            query = query.eq('empresa', filters.empresa);
        }

        if (filters.funcionarioId && filters.funcionarioId !== 'TODOS') {
            query = query.eq('funcionario_id', filters.funcionarioId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as unknown as TrocaPosto[];
    }
};
