import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeiroService } from '../../../services/financeiroService';
import { queryKeys } from '../../../lib/queryClient';
import type { Contrato } from '../types';

export function useContratos() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.contratos.list(),
        queryFn: () => financeiroService.getContratos(),
        select: (data) => (data || []).sort((a, b) => a.contratante.localeCompare(b.contratante)),
    });

    const createMutation = useMutation({
        mutationFn: (data: Omit<Contrato, 'id'>) => financeiroService.createContrato(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.contratos.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Contrato> }) =>
            financeiroService.updateContrato(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.contratos.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => financeiroService.deleteContrato(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.contratos.all });
        },
    });

    return {
        contratos: query.data ?? [],
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
