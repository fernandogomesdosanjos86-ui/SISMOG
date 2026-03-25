import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trocaPlantaoService } from '../services/trocaPlantaoService';
import { queryKeys, STALE_TIMES } from '../../../lib/queryClient';
import type { TrocaPlantaoFormData } from '../types';

export function useTrocasPlantao(options?: { monthYear?: string; empresa?: 'FEMOG' | 'SEMOG'; searchTerm?: string }) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.trocasPlantao.list(options?.monthYear, options?.empresa, options?.searchTerm),
        queryFn: () => trocaPlantaoService.getTrocasPlantao(options),
        staleTime: STALE_TIMES.MODERATE,
    });

    const mesesQuery = useQuery({
        queryKey: queryKeys.trocasPlantao.meses(),
        queryFn: trocaPlantaoService.getMesesComLancamento,
        staleTime: STALE_TIMES.STATIC,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.trocasPlantao.all });
    };

    const createMutation = useMutation({
        mutationFn: trocaPlantaoService.createTroca,
        onSuccess: invalidate,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<TrocaPlantaoFormData> }) => 
            trocaPlantaoService.updateTroca(id, data),
        onSuccess: invalidate,
    });

    const cancelarMutation = useMutation({
        mutationFn: trocaPlantaoService.cancelarTroca,
        onSuccess: invalidate,
    });

    const aceitarCoberturaMutation = useMutation({
        mutationFn: ({ id, aceito }: { id: string; aceito: boolean }) => 
            trocaPlantaoService.aceitarCobertura(id, aceito),
        onSuccess: invalidate,
    });

    const aprovarReprovarMutation = useMutation({
        mutationFn: ({ id, aprovado, responsavelId }: { id: string; aprovado: boolean; responsavelId: string }) => 
            trocaPlantaoService.aprovarReprovarTroca(id, aprovado, responsavelId),
        onSuccess: invalidate,
    });

    const deleteMutation = useMutation({
        mutationFn: trocaPlantaoService.deleteTroca,
        onSuccess: invalidate,
    });

    return {
        trocas: query.data ?? [],
        isLoading: query.isLoading,
        mesesDisponiveis: mesesQuery.data ?? [],
        isLoadingMeses: mesesQuery.isLoading,
        refetch: query.refetch,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        cancelar: cancelarMutation.mutateAsync,
        aceitarCobertura: aceitarCoberturaMutation.mutateAsync,
        aprovarReprovar: aprovarReprovarMutation.mutateAsync,
        delete: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isCanceling: cancelarMutation.isPending,
        isWorking: createMutation.isPending || updateMutation.isPending || 
                   cancelarMutation.isPending || aceitarCoberturaMutation.isPending || 
                   aprovarReprovarMutation.isPending || deleteMutation.isPending
    };
}
