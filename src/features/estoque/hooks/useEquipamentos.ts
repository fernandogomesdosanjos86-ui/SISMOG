import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { equipamentosService } from '../../../services/equipamentosService';
import { queryKeys } from '../../../lib/queryClient';
import type { Equipamento } from '../types';

export function useEquipamentos() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.equipamentos.list(),
        queryFn: () => equipamentosService.getEquipamentos(),
    });

    const destinacoesQuery = useQuery({
        queryKey: queryKeys.equipamentos.destinacoes(),
        queryFn: () => equipamentosService.getDestinacoes(),
    });

    const createMutation = useMutation({
        mutationFn: (data: Partial<Equipamento>) => equipamentosService.createEquipamento(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.equipamentos.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Equipamento> }) =>
            equipamentosService.updateEquipamento(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.equipamentos.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => equipamentosService.deleteEquipamento(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.equipamentos.all });
        },
    });

    const destinarMutation = useMutation({
        mutationFn: (data: { equipamento_id: string; contrato_id: string; quantidade: number }) =>
            equipamentosService.destinarEquipamento(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.equipamentos.all });
        },
    });

    const devolverMutation = useMutation({
        mutationFn: ({ destinacaoId, quantidade }: { destinacaoId: string; quantidade?: number }) =>
            equipamentosService.devolverEquipamento(destinacaoId, quantidade),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.equipamentos.all });
        },
    });

    return {
        equipamentos: query.data ?? [],
        destinacoes: destinacoesQuery.data ?? [],
        isLoading: query.isLoading,
        isLoadingDestinacoes: destinacoesQuery.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
        refetchDestinacoes: destinacoesQuery.refetch,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        delete: deleteMutation.mutateAsync,
        destinar: destinarMutation.mutateAsync,
        devolver: devolverMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isDestinando: destinarMutation.isPending,
        isDevolvendo: devolverMutation.isPending,
    };
}
