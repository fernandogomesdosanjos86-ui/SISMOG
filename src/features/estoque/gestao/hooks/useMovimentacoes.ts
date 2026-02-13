import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { estoqueGestaoService } from '../../../../services/estoqueGestaoService';
import { queryKeys } from '../../../../lib/queryClient';
import { useModal } from '../../../../context/ModalContext';
import type { MovimentacaoFormData } from '../types';

export function useMovimentacoes() {
    const queryClient = useQueryClient();
    const { showFeedback } = useModal();

    const query = useQuery({
        queryKey: queryKeys.estoqueMovimentacoes.list(),
        queryFn: () => estoqueGestaoService.getMovimentacoes(),
    });

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.estoqueMovimentacoes.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.estoqueProdutos.all });
    };

    const createMutation = useMutation({
        mutationFn: (data: MovimentacaoFormData) => estoqueGestaoService.createMovimentacao(data),
        onSuccess: () => {
            invalidateAll();
            showFeedback('success', 'Movimentação registrada com sucesso!');
        },
        onError: (error: Error) => {
            showFeedback('error', error.message || 'Erro ao registrar movimentação.');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<MovimentacaoFormData> }) =>
            estoqueGestaoService.updateMovimentacao(id, data),
        onSuccess: () => {
            invalidateAll();
            showFeedback('success', 'Movimentação atualizada com sucesso!');
        },
        onError: (error: Error) => {
            showFeedback('error', error.message || 'Erro ao atualizar movimentação.');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => estoqueGestaoService.deleteMovimentacao(id),
        onSuccess: () => {
            invalidateAll();
            showFeedback('success', 'Movimentação excluída com sucesso!');
        },
        onError: (error: Error) => {
            showFeedback('error', error.message || 'Erro ao excluir movimentação.');
        },
    });

    return {
        movimentacoes: query.data ?? [],
        isLoading: query.isLoading,
        refetch: query.refetch,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        delete: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
