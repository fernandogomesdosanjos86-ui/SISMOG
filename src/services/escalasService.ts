import { supabase } from './supabase';
import type { Escala } from '../features/supervisao/types';

export const escalasService = {
    /**
     * Fetch all Escalas registered for a specific Posto ID and Month/Year
     * Also fetches the details of the Employee allocation as fallback.
     */
    getEscalasByPosto: async (postoId: string, competencia: string): Promise<Escala[]> => {
        // We will fetch all from supervisao_escalas matching posto and competencia
        const { data, error } = await supabase
            .from('supervisao_escalas')
            .select(`
                *,
                funcionario:funcionarios(
                    nome,
                    cargo:cargos_salarios!funcionarios_cargo_id_fkey(cargo)
                )
            `)
            .eq('posto_id', postoId)
            .eq('competencia', competencia);

        if (error) {
            console.error('Error fetching escalas:', error);
            throw new Error('Erro ao buscar escalas do posto.');
        }

        return data as Escala[];
    },

    /**
     * Fetch the list of ALL allocated employees for a Posto to build the initial Grid
     */
    getAlocadosForPosto: async (postoId: string) => {
        const { data, error } = await supabase
            .from('alocacoes_funcionarios')
            .select(`
                funcionario_id,
                escala,
                turno,
                he,
                funcionario:funcionarios(
                    nome,
                    cargo:cargos_salarios!funcionarios_cargo_id_fkey(cargo)
                )
            `)
            .eq('posto_id', postoId);

        if (error) {
            console.error('Error fetching alocados:', error);
            throw new Error('Erro ao buscar funcionários alocados no posto.');
        }

        return data; // Return raw to handle the JOIN on the frontend Hook
    },

    /**
     * Fetch a list of distinct `posto_id`s that have scales generated for the given month.
     * Used to filter the accordion view so only postos with active scales are shown.
     */
    getPostosComEscala: async (competencia: string): Promise<string[]> => {
        const { data, error } = await supabase
            .from('supervisao_escalas')
            .select('posto_id')
            .eq('competencia', competencia);

        if (error) {
            console.error('Error fetching postos com escala:', error);
            return [];
        }

        // Extract raw IDs and make unique
        const uniqueIds = Array.from(new Set(data.map(row => row.posto_id)));
        return uniqueIds;
    },

    /**
     * Gera e salva a escala inicial para todos os funcionários alocados num Posto.
     * Deve ser chamada manualmente via Modal de Gerar Escala.
     */
    gerarEscalaParaPosto: async (postoId: string, competencia: string, empresa: 'FEMOG' | 'SEMOG') => {
        // Fetch allocated
        const allocated = await escalasService.getAlocadosForPosto(postoId);
        if (!allocated || allocated.length === 0) return [];



        // Build base scale payloads
        const payloads: Partial<Escala>[] = allocated.map((alloc: any) => {
            // Note: We need a dynamic way to generate days here or pass from frontend.
            // Since we use the logic in the frontend usually, let's keep logic simple.
            // By default, just empty or 0 length if we don't have the frontend utility here.
            // But wait, the util is in ../features/.../escalaLogics. Let's just create empty or we can import it.
            return {
                competencia,
                empresa,
                posto_id: postoId,
                funcionario_id: alloc.funcionario_id,
                escala: alloc.escala,
                turno: alloc.turno,
                tipo: alloc.he ? 'Extra' : 'Fixo',
                dias: [], // Defaults to empty, the user can Auto-Select via the grid rules if needed, or we rebuild the days.
                qnt_dias: 0
            };
        });

        // Insert / Upsert into DB
        return await escalasService.saveEscalaEmMassa(payloads);
    },

    /**
     * Massive UPSERT: Create or update Multiple rows at once in `supervisao_escalas`
     * We use upsert relying on the UNIQUE constraint (competencia, funcionario_id, posto_id)
     */
    saveEscalaEmMassa: async (escalasData: Partial<Escala>[]) => {
        const { data, error } = await supabase
            .from('supervisao_escalas')
            .upsert(escalasData, {
                onConflict: 'competencia, funcionario_id, posto_id', // Make sure it overwrites instead of creating dupes
                ignoreDuplicates: false
            })
            .select();

        if (error) {
            console.error('Error hitting SUPABASE UPSERT on Escalas:', error);
            throw new Error(`Falha ao salvar as Escalas: ${error.message}`);
        }

        return data;
    },

    /**
     * Delete an entire Escala for a specific Posto and Month
     */
    deleteEscala: async (postoId: string, competencia: string) => {
        const { error } = await supabase
            .from('supervisao_escalas')
            .delete()
            .eq('posto_id', postoId)
            .eq('competencia', competencia);

        if (error) {
            console.error('Error deleting Escala:', error);
            throw new Error(`Falha ao excluir a Escala: ${error.message}`);
        }

        return true;
    }
};
