import { supabase } from './supabase';
import type { Penalidade, PenalidadeFormData } from '../features/rh/types';

export const penalidadesService = {
    async getPenalidades() {
        const { data, error } = await supabase
            .from('rh_penalidades')
            .select(`
                *,
                funcionario:funcionarios(nome)
            `)
            .order('data', { ascending: false });

        if (error) throw error;
        return data as Penalidade[];
    },

    async createPenalidade(penalidadeData: PenalidadeFormData, file?: File | null) {
        let arquivo_url = undefined;

        // Handle File Upload if provided
        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${penalidadeData.funcionario_id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('penalidades')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('penalidades')
                .getPublicUrl(filePath);

            arquivo_url = publicUrl;
        }

        const { data, error } = await supabase
            .from('rh_penalidades')
            .insert({ ...penalidadeData, arquivo_url })
            .select()
            .single();

        if (error) throw error;
        return data as Penalidade;
    },

    async updatePenalidade(id: string, penalidadeData: Partial<PenalidadeFormData>, newFile?: File | null, existingFileUrl?: string) {
        let arquivo_url = penalidadeData.arquivo_url;

        // If a new file is uploaded, we upload it and optionally could delete the old one
        if (newFile) {
            const fileExt = newFile.name.split('.').pop();
            const fileName = `${penalidadeData.funcionario_id || 'update'}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('penalidades')
                .upload(filePath, newFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('penalidades')
                .getPublicUrl(filePath);

            arquivo_url = publicUrl;

            // Optionally delete the old file if it existed
            if (existingFileUrl) {
                const oldFilePath = existingFileUrl.split('/').pop();
                if (oldFilePath) {
                    await supabase.storage.from('penalidades').remove([oldFilePath]);
                }
            }
        } else if (newFile === null && existingFileUrl) {
            // This means the user explicitly removed the file without uploading a new one
            const oldFilePath = existingFileUrl.split('/').pop();
            if (oldFilePath) {
                await supabase.storage.from('penalidades').remove([oldFilePath]);
            }
            arquivo_url = null as any; // Clear it out
        }

        const { data, error } = await supabase
            .from('rh_penalidades')
            .update({ ...penalidadeData, arquivo_url })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Penalidade;
    },

    async deletePenalidade(id: string, fileUrl?: string) {
        // Delete the record
        const { error } = await supabase
            .from('rh_penalidades')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // If there was an attached file, delete it from storage
        if (fileUrl) {
            const filePath = fileUrl.split('/').pop();
            if (filePath) {
                await supabase.storage.from('penalidades').remove([filePath]);
            }
        }
    }
};
