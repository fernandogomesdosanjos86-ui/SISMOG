import { supabase } from './supabase';
import type { CargoSalario } from '../features/rh/types';

export const rhService = {
    async getCargosSalarios() {
        const { data, error } = await supabase
            .from('cargos_salarios')
            .select('*')
            .order('cargo', { ascending: true })
            .order('uf', { ascending: true });

        if (error) throw error;
        return data as CargoSalario[];
    },

    async createCargoSalario(cargo: Omit<CargoSalario, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('cargos_salarios')
            .insert(cargo)
            .select()
            .single();

        if (error) throw error;
        return data as CargoSalario;
    },

    async updateCargoSalario(id: string, cargo: Partial<CargoSalario>) {
        const { data, error } = await supabase
            .from('cargos_salarios')
            .update(cargo)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as CargoSalario;
    },

    async deleteCargoSalario(id: string) {
        const { error } = await supabase
            .from('cargos_salarios')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
