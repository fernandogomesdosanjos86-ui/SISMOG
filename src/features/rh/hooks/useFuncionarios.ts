import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhService } from '../../../services/rhService';
import { queryKeys } from '../../../lib/queryClient';
import type { Funcionario, FuncionarioFormData } from '../types';

export function useFuncionarios() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.funcionarios.list(),
        queryFn: () => rhService.getFuncionarios(),
    });

    const createMutation = useMutation({
        mutationFn: (data: FuncionarioFormData) => rhService.createFuncionario(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.funcionarios.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Funcionario> }) =>
            rhService.updateFuncionario(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.funcionarios.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => rhService.deleteFuncionario(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.funcionarios.all });
        },
    });

    // Helper hook to fetch cargos for the form
    const useCargos = () => useQuery({
        queryKey: queryKeys.cargos.list(),
        queryFn: () => rhService.getCargosSalarios(),
    });

    return {
        funcionarios: query.data ?? [],
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
        useCargos,
    };
}
