import { supabase } from '../lib/supabase';

export const usuariosService = {
    // Buscar todos os usuários (com filtro de status opcional)
    async getAll(status = null) {
        let query = supabase
            .from('usuarios')
            .select('*')
            .is('deleted_at', null)
            .order('nome_completo', { ascending: true });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    // Buscar usuário por ID
    async getById(id) {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Atualizar usuário (tipo e status)
    async update(id, updateData) {
        // Sanitizar payload - apenas campos permitidos
        const allowedFields = ['tipo', 'status', 'nome_completo', 'cpf', 'telefone'];
        const payload = {};

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                payload[field] = updateData[field];
            }
        }

        payload.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('usuarios')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Soft Delete
    async delete(id) {
        const { error } = await supabase
            .from('usuarios')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Buscar permissões do usuário
    async getPermissoes(usuarioId) {
        const { data, error } = await supabase
            .from('permissoes_usuario')
            .select('*')
            .eq('usuario_id', usuarioId);

        if (error) throw error;
        return data || [];
    },

    // Salvar permissões do usuário (upsert)
    async savePermissoes(usuarioId, permissoes) {
        // 1. Deletar permissões antigas
        const { error: deleteError } = await supabase
            .from('permissoes_usuario')
            .delete()
            .eq('usuario_id', usuarioId);

        if (deleteError) throw deleteError;

        // 2. Filtrar apenas permissões que não são 'sem_acesso'
        const permissoesParaSalvar = permissoes
            .filter(p => p.nivel !== 'sem_acesso')
            .map(p => ({
                usuario_id: usuarioId,
                modulo: p.modulo,
                submodulo: p.submodulo || null,
                nivel: p.nivel
            }));

        // 3. Inserir novas permissões
        if (permissoesParaSalvar.length > 0) {
            const { error: insertError } = await supabase
                .from('permissoes_usuario')
                .insert(permissoesParaSalvar);

            if (insertError) throw insertError;
        }

        return true;
    },

    // Contar usuários por status (para badges nas abas)
    async countByStatus() {
        const { data, error } = await supabase
            .from('usuarios')
            .select('status')
            .is('deleted_at', null);

        if (error) throw error;

        const counts = {
            aguardando_aprovacao: 0,
            ativo: 0,
            inativo: 0
        };

        data?.forEach(u => {
            if (counts[u.status] !== undefined) {
                counts[u.status]++;
            }
        });

        return counts;
    }
};
