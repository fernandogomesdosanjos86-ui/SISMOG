import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeiroService } from '../../../services/financeiroService';
import { queryKeys } from '../../../lib/queryClient';
import type { ContaFinanceiraFormData, AjusteSaldoFormData } from '../types';

export function useContasFinanceiras() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.contasFinanceiras.list(),
        queryFn: () => financeiroService.getContasFinanceiras(),
    });

    const createMutation = useMutation({
        mutationFn: (data: ContaFinanceiraFormData) => financeiroService.createContaFinanceira(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.contasFinanceiras.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ContaFinanceiraFormData> }) =>
            financeiroService.updateContaFinanceira(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.contasFinanceiras.all });
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'ativa' | 'inativa' }) =>
            financeiroService.toggleStatusContaFinanceira(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.contasFinanceiras.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => financeiroService.deleteContaFinanceira(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.contasFinanceiras.all });
        },
    });

    const ajustarSaldoMutation = useMutation({
        mutationFn: ({
            contaId,
            dados,
            usuario
        }: {
            contaId: string;
            dados: AjusteSaldoFormData;
            usuario?: { id?: string; nome?: string };
        }) => financeiroService.ajustarSaldoConta(contaId, dados, usuario),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.contasFinanceiras.all });
            queryClient.invalidateQueries({ queryKey: queryKeys.contasFinanceiras.ajustes(variables.contaId) });
        },
    });

    return {
        contas: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
        createConta: createMutation.mutateAsync,
        updateConta: updateMutation.mutateAsync,
        toggleStatus: toggleStatusMutation.mutateAsync,
        deleteConta: deleteMutation.mutateAsync,
        ajustarSaldo: ajustarSaldoMutation.mutateAsync,
        isSubmitting:
            createMutation.isPending ||
            updateMutation.isPending ||
            toggleStatusMutation.isPending ||
            deleteMutation.isPending ||
            ajustarSaldoMutation.isPending,
    };
}
