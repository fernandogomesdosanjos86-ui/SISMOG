import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryClient';
import { useModal } from '../../../context/ModalContext';
import { escalasService } from '../../../services/escalasService';
import type { Escala } from '../types';
import { generateDaysForEscala, getEscalaRowKey } from '../utils/escalaLogics';

export function useEscalas(postoId: string | null, competencia: string, _empresa: 'FEMOG' | 'SEMOG') {
    const queryClient = useQueryClient();
    const { showFeedback } = useModal();

    // Estado local para gerenciar as edições no frontend antes do botão "Salvar"
    const [localEscalas, setLocalEscalas] = useState<Partial<Escala>[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Parse YYYY-MM
    const year = parseInt(competencia.split('-')[0] || new Date().getFullYear().toString());
    const month = parseInt(competencia.split('-')[1] || (new Date().getMonth() + 1).toString());

    const { data: scalesData, isLoading, refetch } = useQuery({
        queryKey: queryKeys.escalas.list(postoId || '', competencia),
        queryFn: async () => {
            if (!postoId) return [];

            // 1. Fetch saved scales for this Posto & month
            const savedEscalas = await escalasService.getEscalasByPosto(postoId, competencia);
            return savedEscalas;
        },
        enabled: !!postoId,
    });

    // Populate local state whenever API data changes
    useEffect(() => {
        if (scalesData) {
            setLocalEscalas(scalesData);
            setHasUnsavedChanges(false);
        }
    }, [scalesData]);


    // Handlers for Component Interaction (No DB saving yet)
    const handleUpdateEscala = (rowKey: string, updates: Partial<Escala>) => {
        setLocalEscalas(prev => prev.map(item => {
            const currentKey = getEscalaRowKey(item);
            if (currentKey === rowKey || (item.id && item.id === rowKey) || item.funcionario_id === rowKey) {
                // Se mudou a escala base ou o inicio 1/2, a gente auto-recalcula os checkboxes de dias.
                let newDias = item.dias || [];

                if (updates.escala && updates.escala !== item.escala) {
                    newDias = generateDaysForEscala(updates.escala as any, updates.inicio_12x36 || item.inicio_12x36, month, year);
                } else if (updates.inicio_12x36 !== undefined && updates.inicio_12x36 !== item.inicio_12x36) {
                    newDias = generateDaysForEscala(item.escala as any, updates.inicio_12x36, month, year);
                }

                // If days intentionally updated manually (checkbox array sent directly from Component)
                if (updates.dias) {
                    newDias = updates.dias;
                }

                return {
                    ...item,
                    ...updates,
                    dias: newDias,
                    qnt_dias: newDias.length
                };
            }
            return item;
        }));
        setHasUnsavedChanges(true);
    };

    // The UPSERT MUTATION
    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!postoId) throw new Error("Sem Posto selecionado");

            // Clean up joined nested fields before sending back to supabase
            // We KEEP `id` so supabase knows to update existing rows instead of inserting duplicates
            const rawPayloadList = localEscalas.map(esc => {
                const { funcionario, created_at, updated_at, ...rest } = esc as any;
                return rest;
            });

            return await escalasService.saveEscalaEmMassa(rawPayloadList);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.escalas.list(postoId || '', competencia) });
            showFeedback('success', 'Escala salva com sucesso!');
            setHasUnsavedChanges(false);
        },
        onError: (error) => {
            console.error('Save fail:', error);
            showFeedback('error', 'Erro ao salvar escala.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            if (!postoId) return;
            await escalasService.deleteEscala(postoId, competencia);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.escalas.list(postoId || '', competencia) });
            queryClient.invalidateQueries({ queryKey: queryKeys.escalas.postosComEscala(competencia) });
            showFeedback('success', 'Escala excluída com sucesso!');
            setHasUnsavedChanges(false);
            setLocalEscalas([]);
        },
        onError: (error) => {
            console.error('Delete fail:', error);
            showFeedback('error', 'Erro ao excluir escala.');
        }
    });

    const syncMutation = useMutation({
        mutationFn: async () => {
            if (!postoId) throw new Error("Sem Posto selecionado");
            return await escalasService.syncEscalaComAlocacoes(postoId, competencia, _empresa);
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.escalas.list(postoId || '', competencia) });
            queryClient.invalidateQueries({ queryKey: queryKeys.escalas.postosComEscala(competencia) });
            showFeedback('success', `Alocações sincronizadas com sucesso! ${res.addedCount} adicionado(s), ${res.removedCount} removido(s).`);
            setHasUnsavedChanges(false);
            refetch();
        },
        onError: (error: any) => {
            console.error('Sync fail:', error);
            showFeedback('error', error?.message || 'Erro ao sincronizar alocações da escala.');
        }
    });

    return {
        localEscalas,
        isLoading,
        hasUnsavedChanges,
        handleUpdateEscala,
        handleUpdateFuncionario: handleUpdateEscala,
        saveEscala: saveMutation.mutateAsync,
        deleteEscala: deleteMutation.mutateAsync,
        syncAlocacoes: syncMutation.mutateAsync,
        isSaving: saveMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isSyncing: syncMutation.isPending,
        refetch
    };
}
