import { supabase } from './supabase';
import type { BancoHoras, BancoHorasFormData } from '../features/supervisao/types';

export const bancoHorasService = {
    async getBancoHoras() {
        const { data, error } = await supabase
            .from('supervisao_banco_horas')
            .select(`
                *,
                funcionario:funcionarios(nome)
            `)
            .order('data', { ascending: false });

        if (error) throw error;
        return data as BancoHoras[];
    },

    async createBancoHoras(data: BancoHorasFormData) {
        const { data: newBancoHoras, error } = await supabase
            .from('supervisao_banco_horas')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return newBancoHoras;
    },

    async updateBancoHoras(id: string, data: Partial<BancoHorasFormData>) {
        const { data: updatedBancoHoras, error } = await supabase
            .from('supervisao_banco_horas')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return updatedBancoHoras;
    },

    async deleteBancoHoras(id: string) {
        const { error } = await supabase
            .from('supervisao_banco_horas')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
