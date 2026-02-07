import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeiroService } from '../../../services/financeiroService';
import { queryKeys } from '../../../lib/queryClient';
import type { Faturamento } from '../types';

export function useFaturamentos(competencia: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.faturamentos.list(competencia),
        queryFn: () => financeiroService.getFaturamentos(competencia),
    });

    const generateMutation = useMutation({
        mutationFn: (month: string) => financeiroService.generateFaturamentos(month),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.faturamentos.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Faturamento> }) =>
            financeiroService.updateFaturamento(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.faturamentos.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => financeiroService.deleteFaturamento(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.faturamentos.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.recebimentos.all });
        },
    });

    const emitMutation = useMutation({
        mutationFn: ({ id, nfNumber }: { id: string; nfNumber: string }) =>
            financeiroService.emitirNota(id, nfNumber),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.faturamentos.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.recebimentos.all });
        },
    });

    const undoEmissionMutation = useMutation({
        mutationFn: (id: string) => financeiroService.desfazerFaturamento(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.faturamentos.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.recebimentos.all });
        },
    });

    return {
        faturamentos: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
        generate: generateMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        delete: deleteMutation.mutateAsync,
        emit: emitMutation.mutateAsync,
        undoEmission: undoEmissionMutation.mutateAsync,
        isGenerating: generateMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isEmitting: emitMutation.isPending,
    };
}
