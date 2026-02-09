import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rhService } from '../../../services/rhService';
import { queryKeys } from '../../../lib/queryClient';
import type { CargoSalario } from '../types';

export function useCargosSalarios() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.cargos.list(),
        queryFn: () => rhService.getCargosSalarios(),
    });

    const createMutation = useMutation({
        mutationFn: (data: Omit<CargoSalario, 'id'>) => rhService.createCargoSalario(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cargos.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CargoSalario> }) =>
            rhService.updateCargoSalario(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cargos.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => rhService.deleteCargoSalario(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.cargos.all });
        },
    });

    return {
        cargosSalarios: query.data ?? [],
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
