import { supabase } from '../lib/supabase';

export const veiculosService = {
    // GET ALL (Active)
    async getAll(empresaId = null) {
        let query = supabase
            .from('veiculos')
            .select(`
                *,
                empresas (
                    id,
                    nome_empresa
                )
            `)
            .is('deleted_at', null)
            .order('modelo', { ascending: true });

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
            .from('veiculos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // CREATE
    async create(veiculo) {
        // Sanitização: Garantir que não envie objetos aninhados
        const { empresas, ...payload } = veiculo;

        const { data, error } = await supabase
            .from('veiculos')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // UPDATE
    async update(id, veiculo) {
        // Sanitização
        const { empresas, created_at, updated_at, id: _, ...payload } = veiculo;

        const { data, error } = await supabase
            .from('veiculos')
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
            .from('veiculos')
            .update({ deleted_at: new Date() })
            .eq('id', id);

        if (error) throw error;
        return data;
    }
};
