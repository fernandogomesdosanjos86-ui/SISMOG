import { supabase } from '../lib/supabase';

export const contasService = {
    // List with Soft Delete filter and Company Relation
    async getAll() {
        const { data, error } = await supabase
            .from('contas_bancarias')
            .select(`
        *,
        empresas (
          nome_empresa
        )
      `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Create
    async create(data) {
        const { data: result, error } = await supabase
            .from('contas_bancarias')
            .insert([{
                ...data,
            }])
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    // Update
    async update(id, data) {
        const { data: result, error } = await supabase
            .from('contas_bancarias')
            .update({
                ...data,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    // Soft Delete
    async delete(id) {
        const { error } = await supabase
            .from('contas_bancarias')
            .update({
                deleted_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
