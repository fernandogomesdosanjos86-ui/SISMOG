import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { movimentacoesService } from '../services/movimentacoesService';
import type { MovimentacaoFormData, MovimentacoesFilters } from '../types';
import { queryKeys } from '../../../lib/queryClient';

export function useMovimentacoes(filters: Partial<MovimentacoesFilters> = {}) {
    const queryClient = useQueryClient();

    // Query for the paginated list
    const { data: movimentacoesData, isLoading, refetch } = useQuery({
        queryKey: [...queryKeys.frota.movimentacoes.all, filters],
        queryFn: () => movimentacoesService.getMovimentacoes(filters as MovimentacoesFilters),
    });

    // Query for the total KPIs (month aggregate)
    const { data: kpis } = useQuery({
        queryKey: [...queryKeys.frota.movimentacoes.all, 'kpis', filters.month, filters.year, filters.searchTerm],
        queryFn: () => movimentacoesService.getMovimentacoesKpis(
            filters.month || new Date().getMonth().toString(),
            filters.year || new Date().getFullYear().toString(),
            filters.searchTerm
        ),
        enabled: !!filters.month && !!filters.year
    });

    const createMutation = useMutation({
        mutationFn: ({ data, veiculoTipo, veiculoCapacidadeBateria }: { data: MovimentacaoFormData, veiculoTipo: string, veiculoCapacidadeBateria?: number }) =>
            movimentacoesService.createMovimentacao(data, veiculoTipo, veiculoCapacidadeBateria),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.frota.movimentacoes.all });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data, veiculoTipo, veiculoCapacidadeBateria }: { id: string, data: MovimentacaoFormData, veiculoTipo: string, veiculoCapacidadeBateria?: number }) =>
            movimentacoesService.updateMovimentacao(id, data, veiculoTipo, veiculoCapacidadeBateria),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.frota.movimentacoes.all });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: movimentacoesService.deleteMovimentacao,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.frota.movimentacoes.all });
        }
    });

    return {
        movimentacoes: movimentacoesData?.data || [],
        totalPages: movimentacoesData?.totalPages || 0,
        totalCount: movimentacoesData?.count || 0,
        kpis,
        isLoading,
        refetch,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        delete: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending
    };
}
