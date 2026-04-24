import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bancoHorasService } from '../../../services/bancoHorasService';
import type { BancoHorasFormData } from '../types';

export function useBancoHoras() {
    const queryClient = useQueryClient();

    const { data: bancoHoras = [], isLoading, error, refetch } = useQuery({
        queryKey: ['bancoHoras'],
        queryFn: () => bancoHorasService.getBancoHoras(),
    });

    const createMutation = useMutation({
        mutationFn: (data: BancoHorasFormData) => bancoHorasService.createBancoHoras(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bancoHoras'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<BancoHorasFormData> }) =>
            bancoHorasService.updateBancoHoras(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bancoHoras'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => bancoHorasService.deleteBancoHoras(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bancoHoras'] });
        },
    });

    return {
        bancoHoras,
        isLoading,
        error,
        refetch,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        delete: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
