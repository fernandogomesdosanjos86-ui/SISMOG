import { supabase } from '../lib/supabase';

export const empresasService = {
    // List with Soft Delete filter
    async getAll() {
        const { data, error } = await supabase
            .from('empresas')
            .select('*')
            .is('deleted_at', null)
            .order('nome_empresa', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Create
    async create(empresaData) {
        const { data, error } = await supabase
            .from('empresas')
            .insert([{
                ...empresaData,
                // created_by: 'USER_UUID_PLACEHOLDER' // To be implemented with Auth
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update
    async update(id, empresaData) {
        const { data, error } = await supabase
            .from('empresas')
            .update({
                ...empresaData,
                updated_at: new Date().toISOString()
                // updated_by: 'USER_UUID_PLACEHOLDER' // To be implemented with Auth
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Soft Delete
    async delete(id) {
        const { error } = await supabase
            .from('empresas')
            .update({
                deleted_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
