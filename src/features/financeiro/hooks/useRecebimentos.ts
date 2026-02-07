import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeiroService } from '../../../services/financeiroService';
import { queryKeys } from '../../../lib/queryClient';
import type { Recebimento } from '../types';

export function useRecebimentos() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.recebimentos.list(),
        queryFn: () => financeiroService.getRecebimentos(),
    });

    const createAvulsoMutation = useMutation({
        mutationFn: (data: Omit<Recebimento, 'id'>) => financeiroService.createRecebimentoAvulso(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.recebimentos.all });
        },
    });

    const registerMutation = useMutation({
        mutationFn: (id: string) => financeiroService.registrarRecebimento(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.recebimentos.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Recebimento> }) =>
            financeiroService.updateRecebimento(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.recebimentos.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => financeiroService.deleteRecebimento(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.recebimentos.all });
        },
    });

    return {
        recebimentos: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
        createAvulso: createAvulsoMutation.mutateAsync,
        register: registerMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        delete: deleteMutation.mutateAsync,
        isCreating: createAvulsoMutation.isPending,
        isRegistering: registerMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
