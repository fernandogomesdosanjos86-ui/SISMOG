import { supabase } from '../../../services/supabase';
import type { ParametrosFolha, ParametrosFolhaFormData } from '../types';

export const parametrosFolhaService = {
    async getParametrosFolha() {
        const { data, error } = await supabase
            .from('parametros_folha')
            .select(`
                id,
                ano,
                valor_salario_minimo,
                teto_salario_familia,
                valor_salario_familia,
                teto_inss_1,
                aliquota_inss_1,
                desconto_inss_1,
                teto_inss_2,
                aliquota_inss_2,
                desconto_inss_2,
                teto_inss_3,
                aliquota_inss_3,
                desconto_inss_3,
                teto_inss_4,
                aliquota_inss_4,
                desconto_inss_4,
                created_at,
                updated_at
            `)
            .order('ano', { ascending: false });

        if (error) throw error;
        return data as unknown as ParametrosFolha[];
    },

    async createParametrosFolha(parametros: ParametrosFolhaFormData) {
        const { data, error } = await supabase
            .from('parametros_folha')
            .insert(parametros as any)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as ParametrosFolha;
    },

    async updateParametrosFolha(id: string, parametros: Partial<ParametrosFolhaFormData>) {
        const { data, error } = await supabase
            .from('parametros_folha')
            .update(parametros as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as ParametrosFolha;
    },

    async deleteParametrosFolha(id: string) {
        const { error } = await supabase
            .from('parametros_folha')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
