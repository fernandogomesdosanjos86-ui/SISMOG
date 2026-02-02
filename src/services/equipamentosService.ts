import { supabase } from './supabase';
import type { Equipamento, EquipamentoDestinacao } from '../features/estoque/types';

export const equipamentosService = {
    async getEquipamentos() {
        // Fetch equipments and their destinations to calculate available stock
        const { data: equipamentos, error } = await supabase
            .from('equipamentos')
            .select('*')
            .order('categoria')
            .order('descricao');

        if (error) throw error;

        // Fetch all destinations
        const { data: destinacoes, error: destError } = await supabase
            .from('equipamentos_destinacoes')
            .select('equipamento_id, quantidade');

        if (destError) throw destError;

        // Calculate available stock
        return equipamentos.map(eq => {
            const totalDestinado = destinacoes
                .filter((d: { equipamento_id: any; }) => d.equipamento_id === eq.id)
                .reduce((acc: any, curr: { quantidade: any; }) => acc + curr.quantidade, 0);


            return {
                ...eq,
                total_destinado: totalDestinado,
                disponivel: eq.quantidade - totalDestinado
            } as Equipamento;
        });
    },

    async getDestinacoes() {
        const { data, error } = await supabase
            .from('equipamentos_destinacoes')
            .select(`
                *,
                equipamentos (*),
                contratos (id, contratante, nome_posto, empresa)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as EquipamentoDestinacao[];
    },

    async createEquipamento(equipamento: Partial<Equipamento>) {
        const { data, error } = await supabase
            .from('equipamentos')
            .insert(equipamento)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateEquipamento(id: string, equipamento: Partial<Equipamento>) {
        const { data, error } = await supabase
            .from('equipamentos')
            .update(equipamento)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteEquipamento(id: string) {
        const { error } = await supabase
            .from('equipamentos')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async destinarEquipamento(destinacao: { equipamento_id: string, contrato_id: string, quantidade: number }) {
        const { data, error } = await supabase
            .from('equipamentos_destinacoes')
            .insert(destinacao)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async devolverEquipamento(destinacaoId: string, quantidadeDevolvida?: number) {
        // If returning partial amount (for ammo), update. If full, delete logic or specific handling?
        // Requirement says "Devolver". Usually implies removing the destination record or reducing quantity.
        // If it's Ammo and partial return: Update Qty. If Qty becomes 0 -> Delete.
        // If it's Armament (Qty 1) -> Delete.

        // For simplicity, let's assume "quantity" passed is the amount to REMOVE from the destination.

        if (!quantidadeDevolvida) {
            // Full return/delete
            const { error } = await supabase
                .from('equipamentos_destinacoes')
                .delete()
                .eq('id', destinacaoId);
            if (error) throw error;
            return;
        }

        // Partial return (Complex logic needed? Fetch first)
        const { data: current, error: fetchError } = await supabase
            .from('equipamentos_destinacoes')
            .select('quantidade')
            .eq('id', destinacaoId)
            .single();

        if (fetchError) throw fetchError;

        const newQty = current.quantidade - quantidadeDevolvida;

        if (newQty <= 0) {
            const { error } = await supabase
                .from('equipamentos_destinacoes')
                .delete()
                .eq('id', destinacaoId);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('equipamentos_destinacoes')
                .update({ quantidade: newQty })
                .eq('id', destinacaoId);
            if (error) throw error;
        }
    }
};
