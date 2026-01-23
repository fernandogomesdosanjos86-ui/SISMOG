import { supabase } from '../lib/supabase';

export const contratosService = {
    // GET ALL (Active)
    async getAll(empresaId = null) {
        let query = supabase
            .from('contratos')
            .select(`
        *,
        empresas (
          id,
          nome_empresa
        )
      `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (empresaId) {
            query = query.eq('empresa_id', empresaId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    },

    // GET BY ID
    async getById(id) {
        const { data, error } = await supabase
            .from('contratos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // CREATE
    async create(contrato) {
        // Sanitização: Garantir que não envie objetos aninhados ou campos inválidos
        const { empresas, ...payload } = contrato;

        const { data, error } = await supabase
            .from('contratos')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // UPDATE
    async update(id, contrato) {
        // Sanitização
        const { empresas, created_at, updated_at, ...payload } = contrato;

        const { data, error } = await supabase
            .from('contratos')
            .update({ ...payload, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // DELETE (Soft)
    async delete(id) {
        const { data, error } = await supabase
            .from('contratos')
            .update({ deleted_at: new Date() })
            .eq('id', id);

        if (error) throw error;
        return data;
    }
};
