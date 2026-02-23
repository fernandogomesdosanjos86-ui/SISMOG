import { supabase } from './supabase';
import type { Apontamento, ApontamentoFormData, TipoApontamento } from '../features/supervisao/types';

const APONTAMENTO_RULES: Record<TipoApontamento, { frequencia: number; beneficios: number }> = {
    'Abono': { frequencia: 0, beneficios: -1 },
    'Ausência': { frequencia: -1, beneficios: -1 },
    'Atestado': { frequencia: 0, beneficios: -1 },
    'Curso': { frequencia: 0, beneficios: 0 },
    'Penalidade': { frequencia: -1, beneficios: -1 },
    'Troca Presença': { frequencia: 0, beneficios: 1 },
    'Troca Ausência': { frequencia: 0, beneficios: -1 }
};

export const apontamentosService = {
    async getApontamentos(month: number, year: number) {
        // Calculate start and end of the month
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

        const { data, error } = await supabase
            .from('supervisao_apontamentos')
            .select(`
                *,
                posto:postos_trabalho(nome),
                funcionario:funcionarios(nome)
            `)
            .gte('data', startDate)
            .lte('data', endDate)
            .order('data', { ascending: false });

        if (error) throw error;
        return data as Apontamento[];
    },

    async createApontamento(data: ApontamentoFormData) {
        const regras = APONTAMENTO_RULES[data.apontamento];
        const payload = {
            ...data,
            frequencia_pts: regras.frequencia,
            beneficios_pts: regras.beneficios
        };

        const { data: newApontamento, error } = await supabase
            .from('supervisao_apontamentos')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return newApontamento;
    },

    async updateApontamento(id: string, data: Partial<ApontamentoFormData>) {
        let payload = { ...data };

        // Recalculate points if the 'apontamento' type was changed
        if (data.apontamento) {
            const regras = APONTAMENTO_RULES[data.apontamento];
            payload = {
                ...payload,
                // These points must be re-evaluated since the rule depends directly on the text type
                frequencia_pts: regras.frequencia,
                beneficios_pts: regras.beneficios
            } as any;
        }

        const { data: updatedApontamento, error } = await supabase
            .from('supervisao_apontamentos')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return updatedApontamento;
    },

    async deleteApontamento(id: string) {
        const { error } = await supabase
            .from('supervisao_apontamentos')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
