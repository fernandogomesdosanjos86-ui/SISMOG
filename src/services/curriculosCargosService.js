import { supabase } from '../lib/supabase';

export const curriculosCargosService = {
    /**
     * Lista todos os cargos disponíveis para currículos
     */
    async getAll() {
        const { data, error } = await supabase
            .from('curriculos_cargos')
            .select('*')
            .order('nome', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Cria um novo cargo
     */
    async create(nome) {
        const { data, error } = await supabase
            .from('curriculos_cargos')
            .insert([{ nome }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
