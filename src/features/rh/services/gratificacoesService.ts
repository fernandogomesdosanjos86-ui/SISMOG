import { supabase } from '../../../services/supabase';
import type { Gratificacao, GratificacaoFormData } from '../types';

export const gratificacoesService = {
    async getGratificacoes() {
        const { data, error } = await supabase
            .from('rh_gratificacoes')
            .select(`
                *,
                funcionario:funcionarios(nome)
            `)
            .order('data', { ascending: false });

        if (error) throw error;

        // Transform the nested single-object array from Supabase into a cleaner object
        const transformedData = data?.map((item: any) => ({
            ...item,
            funcionario: Array.isArray(item.funcionario) ? item.funcionario[0] : item.funcionario
        })) || [];

        return transformedData as Gratificacao[];
    },

    async createGratificacao(gratificacao: GratificacaoFormData) {
        const { data, error } = await supabase
            .from('rh_gratificacoes')
            .insert(gratificacao)
            .select()
            .single();

        if (error) throw error;
        return data as Gratificacao;
    },

    async updateGratificacao(id: string, gratificacao: Partial<GratificacaoFormData>) {
        const { data, error } = await supabase
            .from('rh_gratificacoes')
            .update(gratificacao)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Gratificacao;
    },

    async deleteGratificacao(id: string) {
        const { error } = await supabase
            .from('rh_gratificacoes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
