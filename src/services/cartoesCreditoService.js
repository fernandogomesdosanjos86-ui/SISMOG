import { supabase } from '../lib/supabase';

export const cartoesCreditoService = {
    async getAll() {
        const { data, error } = await supabase
            .from('cartoes_credito')
            .select(`
        *,
        empresas (nome_empresa)
      `)
            .order('banco', { ascending: true });

        if (error) throw error;
        return data;
    },

    async getById(id) {
        const { data, error } = await supabase
            .from('cartoes_credito')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(cartao) {
        const { data, error } = await supabase
            .from('cartoes_credito')
            .insert([cartao])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id, cartao) {
        const { data, error } = await supabase
            .from('cartoes_credito')
            .update(cartao)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id) {
        // Soft delete
        const { error } = await supabase
            .from('cartoes_credito')
            .update({ deleted_at: new Date().toISOString(), ativo: false })
            .eq('id', id);

        if (error) throw error;
    },

    async toggleStatus(id, ativo) {
        const { error } = await supabase
            .from('cartoes_credito')
            .update({ ativo })
            .eq('id', id);

        if (error) throw error;
    }
};
