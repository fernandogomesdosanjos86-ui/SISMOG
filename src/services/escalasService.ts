import { supabase } from './supabase';
import type { Escala } from '../features/supervisao/types';
import { generateDaysForEscala } from '../features/supervisao/utils/escalaLogics';

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
        const uniqueIds = Array.from(new Set(data.map((row: any) => row.posto_id)));
        return uniqueIds as string[];
    },

    /**
     * Gera e salva a escala inicial para todos os funcionários alocados num Posto.
     * Mantém funcionários Oficiais (Fixos) e Extras (HE), permitindo que o mesmo colaborador
     * atue como Oficial e como Extra na mesma competência.
     */
    gerarEscalaParaPosto: async (postoId: string, competencia: string, empresa: 'FEMOG' | 'SEMOG') => {
        // Fetch allocated
        const allocated = await escalasService.getAlocadosForPosto(postoId);
        if (!allocated || allocated.length === 0) return [];

        const year = parseInt(competencia.split('-')[0], 10);
        const month = parseInt(competencia.split('-')[1], 10);

        // Deduplicar alocações pelo trio (funcionario_id, he/tipo, turno) para garantir 1 linha por turno/tipo
        const uniqueAllocatedMap = new Map<string, any>();
        for (const alloc of allocated) {
            const tipo = alloc.he ? 'Extra' : 'Fixo';
            const turno = alloc.turno || 'Diurno';
            const key = `${alloc.funcionario_id}_${tipo}_${turno}`;
            if (!uniqueAllocatedMap.has(key)) {
                uniqueAllocatedMap.set(key, alloc);
            }
        }
        const deduplicatedAllocated = Array.from(uniqueAllocatedMap.values());

        // Build base scale payloads
        const payloads: Partial<Escala>[] = deduplicatedAllocated.map((alloc: any) => {
            const isExtra = !!alloc.he;
            // Para Oficial/Fixo: pré-calcula os dias base da escala
            // Para Extra: inicia com array vazio [] para o supervisor selecionar os plantões extras específicos (ex: dia 03)
            const preCalculatedDays = isExtra
                ? []
                : generateDaysForEscala(alloc.escala, undefined, month, year);

            return {
                competencia,
                empresa,
                posto_id: postoId,
                funcionario_id: alloc.funcionario_id,
                escala: alloc.escala,
                turno: alloc.turno,
                tipo: isExtra ? 'Extra' : 'Fixo',
                dias: preCalculatedDays,
                qnt_dias: preCalculatedDays.length
            };
        });

        // Delete existing scales for this posto + competencia before regenerating to ensure clean slate
        await escalasService.deleteEscala(postoId, competencia);

        // Insert fresh scales into DB
        return await escalasService.saveEscalaEmMassa(payloads);
    },

    /**
     * Salva as escalas em massa no banco de dados.
     * Atualiza registros existentes por ID ou insere novos registros.
     */
    saveEscalaEmMassa: async (escalasData: Partial<Escala>[]) => {
        // Deduplicar no frontend para evitar repetições idênticas
        const uniqueEscalas = new Map<string, Partial<Escala>>();
        for (const esc of escalasData) {
            const tipo = esc.tipo || 'Fixo';
            const turno = esc.turno || 'Diurno';
            const key = esc.id || `${esc.competencia}_${esc.funcionario_id}_${esc.posto_id}_${tipo}_${turno}`;
            if (!uniqueEscalas.has(key)) {
                uniqueEscalas.set(key, esc);
            }
        }
        const cleanData = Array.from(uniqueEscalas.values());

        // Separar registros que já possuem ID (update) e registros novos (insert/upsert)
        const withId = cleanData.filter(item => !!item.id);

        // Para os sem ID, garantir deduplicação estrita pela chave única (competencia, funcionario_id, posto_id, tipo, turno)
        const withoutIdMap = new Map<string, Partial<Escala>>();
        for (const item of cleanData.filter(item => !item.id)) {
            const tipo = item.tipo || 'Fixo';
            const turno = item.turno || 'Diurno';
            const conflictKey = `${item.competencia}_${item.funcionario_id}_${item.posto_id}_${tipo}_${turno}`;
            withoutIdMap.set(conflictKey, item);
        }
        const withoutId = Array.from(withoutIdMap.values());

        const results: any[] = [];

        // 1. Upsert com ID
        if (withId.length > 0) {
            const { data: upsertData, error: upsertErr } = await supabase
                .from('supervisao_escalas')
                .upsert(withId as any, {
                    onConflict: 'id',
                    ignoreDuplicates: false
                })
                .select();

            if (upsertErr) {
                console.error('Error upserting with ID:', upsertErr);
                throw new Error(`Falha ao atualizar escalas: ${upsertErr.message}`);
            }
            if (upsertData) results.push(...upsertData);
        }

        // 2. Insert/Upsert novos
        if (withoutId.length > 0) {
            const { data: insertData, error: insertErr } = await supabase
                .from('supervisao_escalas')
                .upsert(withoutId as any, {
                    onConflict: 'competencia, funcionario_id, posto_id, tipo, turno',
                    ignoreDuplicates: false
                })
                .select();

            if (insertErr) {
                console.error('Error saving new escalas:', insertErr);
                throw new Error(`Falha ao salvar novas escalas: ${insertErr.message}`);
            }
            if (insertData) results.push(...insertData);
        }

        return results;
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
    },

    /**
     * Sincroniza a escala atual do posto com as alocações da tabela base (alocacoes_funcionarios).
     * - Adiciona novos colaboradores alocados (preservando o cálculo de dias padrão para oficial e vazio para extra)
     * - Remove da escala colaboradores que foram desalocados do posto
     * - Preserva intactos os dias já marcados para quem permaneceu alocado
     */
    syncEscalaComAlocacoes: async (postoId: string, competencia: string, empresa: 'FEMOG' | 'SEMOG') => {
        // 1. Buscar alocações atuais no posto
        const allocated = await escalasService.getAlocadosForPosto(postoId);

        const year = parseInt(competencia.split('-')[0], 10);
        const month = parseInt(competencia.split('-')[1], 10);

        // Deduplicar alocações atuais pelo trio (funcionario_id, tipo, turno)
        const uniqueAllocatedMap = new Map<string, any>();
        for (const alloc of (allocated || [])) {
            const tipo = alloc.he ? 'Extra' : 'Fixo';
            const turno = alloc.turno || 'Diurno';
            const key = `${alloc.funcionario_id}_${tipo}_${turno}`;
            if (!uniqueAllocatedMap.has(key)) {
                uniqueAllocatedMap.set(key, alloc);
            }
        }

        // 2. Buscar escalas existentes no posto para esta competência
        const currentEscalas = await escalasService.getEscalasByPosto(postoId, competencia);
        const currentEscalasMap = new Map<string, Escala>();
        for (const esc of currentEscalas) {
            const tipo = esc.tipo || 'Fixo';
            const turno = esc.turno || 'Diurno';
            const key = `${esc.funcionario_id}_${tipo}_${turno}`;
            currentEscalasMap.set(key, esc);
        }

        // 3. Identificar os que foram removidos (estavam na escala mas não estão mais alocados)
        const idsToDelete: string[] = [];
        for (const [key, esc] of currentEscalasMap.entries()) {
            if (!uniqueAllocatedMap.has(key)) {
                if (esc.id) idsToDelete.push(esc.id);
            }
        }

        if (idsToDelete.length > 0) {
            const { error: delError } = await supabase
                .from('supervisao_escalas')
                .delete()
                .in('id', idsToDelete);

            if (delError) {
                console.error('Erro ao remover escalas desalocadas:', delError);
                throw new Error(`Falha ao remover colaboradores desalocados: ${delError.message}`);
            }
        }

        // 4. Identificar novos a adicionar
        const toInsert: Partial<Escala>[] = [];
        for (const [key, alloc] of uniqueAllocatedMap.entries()) {
            if (!currentEscalasMap.has(key)) {
                const isExtra = !!alloc.he;
                const preCalculatedDays = isExtra
                    ? []
                    : generateDaysForEscala(alloc.escala, undefined, month, year);

                toInsert.push({
                    competencia,
                    empresa,
                    posto_id: postoId,
                    funcionario_id: alloc.funcionario_id,
                    escala: alloc.escala,
                    turno: alloc.turno,
                    tipo: isExtra ? 'Extra' : 'Fixo',
                    dias: preCalculatedDays,
                    qnt_dias: preCalculatedDays.length
                });
            }
        }

        if (toInsert.length > 0) {
            await escalasService.saveEscalaEmMassa(toInsert);
        }

        return {
            addedCount: toInsert.length,
            removedCount: idsToDelete.length
        };
    }
};
