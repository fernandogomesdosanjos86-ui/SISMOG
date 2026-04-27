import { supabase } from './supabase';
import type { FuncionarioEvento, FuncionarioEventoFormData } from '../features/supervisao/types';

export const funcionariosEventosService = {
    async getFuncionariosEventos() {
        const { data, error } = await supabase
            .from('supervisao_funcionarios_eventos' as any)
            .select('*')
            .order('data', { ascending: false });

        if (error) throw error;
        return (data as unknown) as FuncionarioEvento[];
    },

    async createFuncionarioEvento(data: FuncionarioEventoFormData) {
        const { data: newRecord, error } = await supabase
            .from('supervisao_funcionarios_eventos' as any)
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return newRecord;
    },

    async updateFuncionarioEvento(id: string, data: Partial<FuncionarioEventoFormData>) {
        const { data: updatedRecord, error } = await supabase
            .from('supervisao_funcionarios_eventos' as any)
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return updatedRecord;
    },

    async deleteFuncionarioEvento(id: string) {
        const { error } = await supabase
            .from('supervisao_funcionarios_eventos' as any)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
