import { supabase } from './supabase';
import type { CargoSalario, Funcionario, FuncionarioFormData } from '../features/rh/types';

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
    },

    // --- Funcionários ---
    async getFuncionarios() {
        const { data, error } = await supabase
            .from('funcionarios')
            .select('*, cargos_salarios(cargo, uf)')
            .order('nome', { ascending: true });

        if (error) throw error;
        return data as Funcionario[];
    },

    async createFuncionario(funcionario: FuncionarioFormData) {
        const { data, error } = await supabase
            .from('funcionarios')
            .insert(funcionario)
            .select()
            .single();

        if (error) throw error;
        return data as Funcionario;
    },

    async updateFuncionario(id: string, funcionario: Partial<Funcionario>) {
        const { data, error } = await supabase
            .from('funcionarios')
            .update(funcionario)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Funcionario;
    },

    async deleteFuncionario(id: string) {
        const { error } = await supabase
            .from('funcionarios')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
