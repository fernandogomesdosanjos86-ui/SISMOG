import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parametrosFolhaService } from '../services/parametrosFolhaService';
import { queryKeys, STALE_TIMES } from '../../../lib/queryClient';
import type { ParametrosFolhaFormData } from '../types';

export function useParametrosFolha() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.parametrosFolha.list(),
        queryFn: () => parametrosFolhaService.getParametrosFolha(),
        staleTime: STALE_TIMES.STATIC, // Configurations are mostly static (once per year)
    });

    const createMutation = useMutation({
        mutationFn: (data: ParametrosFolhaFormData) => parametrosFolhaService.createParametrosFolha(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.parametrosFolha.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ParametrosFolhaFormData> }) =>
            parametrosFolhaService.updateParametrosFolha(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.parametrosFolha.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => parametrosFolhaService.deleteParametrosFolha(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.parametrosFolha.all });
        },
    });

    return {
        parametrosFolha: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        delete: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
