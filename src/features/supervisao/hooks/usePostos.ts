import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supervisaoService } from '../../../services/supervisaoService';
import { queryKeys } from '../../../lib/queryClient';
import type { PostoTrabalho, PostoFormData } from '../types';
import { useModal } from '../../../context/ModalContext';

export function usePostos() {
    const queryClient = useQueryClient();
    const { showFeedback } = useModal();

    const query = useQuery({
        queryKey: queryKeys.postos.list(),
        queryFn: () => supervisaoService.getPostos(),
    });

    const createMutation = useMutation({
        mutationFn: (data: PostoFormData) => supervisaoService.createPosto(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.postos.all });
            showFeedback('success', 'Posto criado com sucesso!');
        },
        onError: (error) => {
            console.error('Erro ao criar posto:', error);
            showFeedback('error', 'Erro ao criar posto.');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<PostoFormData> }) =>
            supervisaoService.updatePosto(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.postos.all });
            showFeedback('success', 'Posto atualizado com sucesso!');
        },
        onError: (error) => {
            console.error('Erro ao atualizar posto:', error);
            showFeedback('error', 'Erro ao atualizar posto.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => supervisaoService.deletePosto(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.postos.all });
            showFeedback('success', 'Posto excluído com sucesso!');
        },
        onError: (error) => {
            console.error('Erro ao excluir posto:', error);
            showFeedback('error', 'Erro ao excluir posto.');
        }
    });

    return {
        postos: query.data ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        refetch: query.refetch,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        delete: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
