import { supabase } from '../lib/supabase';

export const curriculosService = {
    /**
     * Lista todos os currículos com join nos cargos
     */
    async getAll() {
        const { data, error } = await supabase
            .from('curriculos')
            .select(`
                *,
                curriculos_cargos:cargo_id(id, nome)
            `)
            .is('deleted_at', null)
            .order('nome_completo', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Filtra currículos por status
     */
    async getByStatus(status) {
        const { data, error } = await supabase
            .from('curriculos')
            .select(`
                *,
                curriculos_cargos:cargo_id(id, nome)
            `)
            .is('deleted_at', null)
            .eq('status', status)
            .order('nome_completo', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Cria um novo currículo
     */
    async create(data) {
        // Sanitizar payload - remover objetos aninhados
        const payload = {
            nome_completo: data.nome_completo,
            cargo_id: data.cargo_id,
            telefone: data.telefone,
            email: data.email || null,
            endereco: data.endereco || null,
            indicacao: data.indicacao || null,
            observacoes: data.observacoes || null,
            arquivo_url: data.arquivo_url || null,
            arquivo_nome: data.arquivo_nome || null,
            status: data.status || 'Pendente',
            data_inclusao: data.data_inclusao || new Date().toISOString().split('T')[0]
        };

        const { data: result, error } = await supabase
            .from('curriculos')
            .insert([payload])
            .select(`
                *,
                curriculos_cargos:cargo_id(id, nome)
            `)
            .single();

        if (error) throw error;
        return result;
    },

    /**
     * Atualiza um currículo existente
     */
    async update(id, data) {
        // Sanitizar payload - remover objetos aninhados
        const payload = { ...data, updated_at: new Date().toISOString() };
        delete payload.curriculos_cargos;
        delete payload.id;
        delete payload.created_at;

        const { data: result, error } = await supabase
            .from('curriculos')
            .update(payload)
            .eq('id', id)
            .select(`
                *,
                curriculos_cargos:cargo_id(id, nome)
            `)
            .single();

        if (error) throw error;
        return result;
    },

    /**
     * Atualiza apenas o status de um currículo
     */
    async updateStatus(id, status) {
        const { data, error } = await supabase
            .from('curriculos')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select(`
                *,
                curriculos_cargos:cargo_id(id, nome)
            `)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Soft delete de um currículo
     */
    async delete(id) {
        const { error } = await supabase
            .from('curriculos')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    /**
     * Upload do arquivo do currículo para o storage
     */
    async uploadArquivo(curriculoId, file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${curriculoId}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('curriculos')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('curriculos')
            .getPublicUrl(filePath);

        // Atualizar currículo com URL e nome do arquivo
        await this.update(curriculoId, {
            arquivo_url: publicUrl,
            arquivo_nome: file.name
        });

        return { url: publicUrl, nome: file.name };
    },

    /**
     * Remove arquivo do storage
     */
    async removeArquivo(filePath) {
        const { error } = await supabase.storage
            .from('curriculos')
            .remove([filePath]);

        if (error) throw error;
        return true;
    }
};
