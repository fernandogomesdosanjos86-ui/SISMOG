import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gratificacoesService } from '../services/gratificacoesService';
import { queryKeys } from '../../../lib/queryClient';
import { useModal } from '../../../context/ModalContext';
import type { GratificacaoFormData } from '../types';

export function useGratificacoes() {
    const queryClient = useQueryClient();
    const { showFeedback } = useModal();

    const query = useQuery({
        queryKey: queryKeys.gratificacoes.list(),
        queryFn: () => gratificacoesService.getGratificacoes(),
    });

    const createMutation = useMutation({
        mutationFn: (data: GratificacaoFormData) => gratificacoesService.createGratificacao(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.gratificacoes.all });
        },
        onError: (error) => {
            console.error('Error creating gratificacao:', error);
            showFeedback('error', 'Erro ao salvar a gratificação.');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<GratificacaoFormData> }) =>
            gratificacoesService.updateGratificacao(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.gratificacoes.all });
        },
        onError: (error) => {
            console.error('Error updating gratificacao:', error);
            showFeedback('error', 'Erro ao atualizar a gratificação.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => gratificacoesService.deleteGratificacao(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.gratificacoes.all });
            showFeedback('success', 'Gratificação excluída com sucesso!');
        },
        onError: (error) => {
            console.error('Error deleting gratificacao:', error);
            showFeedback('error', 'Erro ao excluir a gratificação.');
        }
    });

    return {
        gratificacoes: query.data ?? [],
        isLoading: query.isLoading,
        refetch: query.refetch,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        deleteGratificacao: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
