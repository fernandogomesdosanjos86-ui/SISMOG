import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { estoqueGestaoService } from '../../../../services/estoqueGestaoService';
import { queryKeys } from '../../../../lib/queryClient';
import { useModal } from '../../../../context/ModalContext';
import type { ProdutoFormData } from '../types';

export function useProdutos() {
    const queryClient = useQueryClient();
    const { showFeedback } = useModal();

    const query = useQuery({
        queryKey: queryKeys.estoqueProdutos.list(),
        queryFn: () => estoqueGestaoService.getProdutos(),
    });

    const createMutation = useMutation({
        mutationFn: (data: ProdutoFormData) => estoqueGestaoService.createProduto(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.estoqueProdutos.all });
            showFeedback('success', 'Produto cadastrado com sucesso!');
        },
        onError: (error: Error) => {
            showFeedback('error', error.message || 'Erro ao cadastrar produto.');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ProdutoFormData }) =>
            estoqueGestaoService.updateProduto(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.estoqueProdutos.all });
            showFeedback('success', 'Produto atualizado com sucesso!');
        },
        onError: (error: Error) => {
            showFeedback('error', error.message || 'Erro ao atualizar produto.');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => estoqueGestaoService.deleteProduto(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.estoqueProdutos.all });
            showFeedback('success', 'Produto excluído com sucesso!');
        },
        onError: (error: Error) => {
            showFeedback('error', error.message || 'Erro ao excluir produto.');
        },
    });

    return {
        produtos: query.data ?? [],
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
