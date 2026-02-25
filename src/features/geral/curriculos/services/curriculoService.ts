import { supabase } from '../../../../services/supabase';
import type { Curriculo, CurriculoFormData } from '../types';

export const curriculoService = {
    async getCurriculos() {
        const { data, error } = await supabase
            .from('geral_curriculos')
            .select('*')
            .order('nome', { ascending: true }); // requested: alphabetical

        if (error) throw error;
        return data as Curriculo[];
    },

    async createCurriculo(formData: CurriculoFormData) {
        let arquivo_url = null;

        // Upload file if exists
        if (formData.arquivo) {
            const fileExt = formData.arquivo.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('curriculos')
                .upload(filePath, formData.arquivo);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('curriculos').getPublicUrl(filePath);
            arquivo_url = data.publicUrl;
        }

        const payload = {
            data: formData.data,
            nome: formData.nome,
            cargo: formData.cargo,
            indicacao: formData.indicacao || null,
            observacoes: formData.observacoes || null,
            status: formData.status,
            empresa: formData.empresa,
            arquivo_url
        };

        const { data: result, error } = await supabase
            .from('geral_curriculos')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async updateCurriculo(id: string, formData: Partial<CurriculoFormData>) {
        let arquivo_url = undefined; // undefined ignores update unless changed

        if (formData.arquivo) {
            const fileExt = formData.arquivo.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('curriculos')
                .upload(filePath, formData.arquivo);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('curriculos').getPublicUrl(filePath);
            arquivo_url = data.publicUrl;
        }

        const payload: any = { ...formData };
        if (arquivo_url !== undefined) {
            payload.arquivo_url = arquivo_url;
        }
        delete payload.arquivo;

        const { data: result, error } = await supabase
            .from('geral_curriculos')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async deleteCurriculo(id: string) {
        // Optional: also delete from storage if we have the URL, 
        // but for safety/audit we might just leave the file or clean it up if needed.
        const { error } = await supabase
            .from('geral_curriculos')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
