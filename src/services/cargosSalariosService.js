import { supabase } from '../lib/supabase';

export const cargosSalariosService = {
    // GET ALL (Active)
    async getAll() {
        const { data, error } = await supabase
            .from('cargos_salarios')
            .select(`
        *,
        empresas (
          id,
          nome_empresa
        )
      `)
            .is('deleted_at', null)
            .order('cargo', { ascending: true });

        if (error) throw error;
        return data;
    },

    // GET BY ID
    async getById(id) {
        const { data, error } = await supabase
            .from('cargos_salarios')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // CREATE
    async create(cargosSalario) {
        const { data, error } = await supabase
            .from('cargos_salarios')
            .insert([cargosSalario])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // UPDATE
    async update(id, cargosSalario) {
        const { data, error } = await supabase
            .from('cargos_salarios')
            .update({ ...cargosSalario, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // DELETE (Soft)
    async delete(id) {
        const { data, error } = await supabase
            .from('cargos_salarios')
            .update({ deleted_at: new Date() })
            .eq('id', id);

        if (error) throw error;
        return data;
    }
};
