import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trocaPostoService } from '../services/trocaPostoService';
import { queryKeys, STALE_TIMES } from '../../../lib/queryClient';
import type { TrocaPostoFormData } from '../types';

export function useTrocasPosto(options?: { monthYear?: string; searchTerm?: string }) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.trocasPosto.list(options?.monthYear, options?.searchTerm),
        queryFn: () => trocaPostoService.getTrocasPosto(options),
        staleTime: STALE_TIMES.MODERATE,
    });

    const mesesQuery = useQuery({
        queryKey: queryKeys.trocasPosto.meses(),
        queryFn: trocaPostoService.getMesesComLancamento,
        staleTime: STALE_TIMES.STATIC,
    });

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.trocasPosto.all });
    };

    const createMutation = useMutation({
        mutationFn: trocaPostoService.createTrocaPosto,
        onSuccess: invalidate,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<TrocaPostoFormData> }) => 
            trocaPostoService.updateTrocaPosto(id, data),
        onSuccess: invalidate,
    });

    const deleteMutation = useMutation({
        mutationFn: trocaPostoService.deleteTrocaPosto,
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
        delete: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isWorking: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
    };
}
