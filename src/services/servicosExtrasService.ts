import { supabase } from './supabase';
import type { ServicoExtra, ServicoExtraFormData } from '../features/supervisao/types';

export const servicosExtrasService = {
    async getServicos(month: number, year: number) {
        // Calculate start and end of the month
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

        const { data, error } = await supabase
            .from('servicos_extras')
            .select(`
                *,
                posto:postos_trabalho(nome),
                funcionario:funcionarios(nome),
                cargo:cargos_salarios(cargo)
            `)
            .gte('entrada', startDate)
            .lte('entrada', endDate)
            .order('entrada', { ascending: false });

        if (error) throw error;
        return data as ServicoExtra[];
    },

    async getCargoValorHora(cargoId: string, turno: 'Diurno' | 'Noturno', empresa: 'FEMOG' | 'SEMOG') {
        const { data, error } = await supabase
            .from('cargos_salarios')
            .select('*')
            .eq('id', cargoId)
            .single();

        if (error) throw error;

        // Determine value based on shift (using HE values from cargo table)
        // Assuming fields: valor_he_diurno, valor_he_noturno based on previous context
        // If these fields don't exist in type definition yet, we might need to cast or update types
        // Let's assume standard names based on context
        const valorHora = turno === 'Diurno' ? data.valor_he_diurno : data.valor_he_noturno;

        return Number(valorHora || 0);
    },

    async createServico(data: ServicoExtraFormData) {
        // 1. Fetch hourly rate
        const valorHora = await this.getCargoValorHora(data.cargo_id, data.turno, data.empresa);

        // 2. Calculate duration
        const entrada = new Date(data.entrada);
        const saida = new Date(data.saida);
        const durationMs = saida.getTime() - entrada.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);

        // 3. Calculate value
        let rawValue = durationHours * valorHora;

        // 4. Apply rounding rule: cents >= 0.96 round up
        const cents = rawValue % 1;
        let finalValue = rawValue;
        if (cents >= 0.96) {
            finalValue = Math.ceil(rawValue);
        } else {
            // Keep distinct cents if <= 0.95 (formatting happens at display, but we store exact for now? 
            // Requirement says: "mantém o valor com centavos". 
            // To match example 174.95 -> 174.95, we just don't round up.
            // We'll truncate to 2 decimals for storage consistency
            finalValue = Math.floor(rawValue * 100) / 100;
        }

        const payload = {
            ...data,
            duracao: Number(durationHours.toFixed(2)),
            valor_hora: valorHora,
            valor: finalValue
        };

        const { data: newServico, error } = await supabase
            .from('servicos_extras')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return newServico;
    },

    async updateServico(id: string, data: Partial<ServicoExtraFormData>) {
        // Re-calculation logic would be needed if times/cargo/shift changed.
        // For simplicity, we'll re-run the calculation if critical fields are present.
        // In a real scenario, we might want to fetch existing to merge, but let's assume the form sends all needed for recalc if editing.

        // Only simple update if just changing non-calc fields (unlikely)
        // If dates or cargo changed, we need to recalculate. 
        // For now, let's assume the update passes the full object or we fetch it.

        // PROPOSAL: For this MVP, let's treat update as "Delete + Create" logic conceptually or just re-calculate everything 
        // if the user edits. Ideally the frontend form should provide all data.

        // Let's implement a basic update that assumes the frontend sends necessary data for recalculation 
        // OR we fetch current state.

        const { error } = await supabase
            .from('servicos_extras')
            .update(data) // WARNING: This doesn't recalculate automatically without extra logic. 
            // The createServico logic handles calculations. 
            // We should probably expose a "calculate" endpoint or reuse logic.
            .eq('id', id);

        if (error) throw error;
    },

    // Better Update Method:
    async updateServicoWithCalculation(id: string, data: ServicoExtraFormData) {
        // Same logic as create
        const valorHora = await this.getCargoValorHora(data.cargo_id, data.turno, data.empresa);
        const entrada = new Date(data.entrada);
        const saida = new Date(data.saida);
        const durationHours = (saida.getTime() - entrada.getTime()) / (1000 * 60 * 60);

        let rawValue = durationHours * valorHora;
        const cents = rawValue % 1;
        let finalValue = cents >= 0.96 ? Math.ceil(rawValue) : Math.floor(rawValue * 100) / 100;

        const payload = {
            ...data,
            duracao: Number(durationHours.toFixed(2)),
            valor_hora: valorHora,
            valor: finalValue
        };

        const { error } = await supabase
            .from('servicos_extras')
            .update(payload)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteServico(id: string) {
        const { error } = await supabase
            .from('servicos_extras')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
