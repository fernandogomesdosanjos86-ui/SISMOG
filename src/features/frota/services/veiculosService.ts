import { supabase } from '../../../services/supabase';
import type { Veiculo, VeiculoFormData } from '../types';

export const veiculosService = {
    async getVeiculos() {
        const { data, error } = await supabase
            .from('frota_veiculos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Veiculo[];
    },

    async createVeiculo(veiculo: VeiculoFormData) {
        const { data, error } = await supabase
            .from('frota_veiculos')
            .insert([veiculo])
            .select()
            .single();

        if (error) throw error;
        return data as Veiculo;
    },

    async updateVeiculo(id: string, veiculo: Partial<VeiculoFormData>) {
        const { data, error } = await supabase
            .from('frota_veiculos')
            .update(veiculo)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Veiculo;
    },

    async deleteVeiculo(id: string) {
        const { error } = await supabase
            .from('frota_veiculos')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
