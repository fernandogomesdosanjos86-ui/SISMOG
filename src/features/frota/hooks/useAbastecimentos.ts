import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryClient';
import { useModal } from '../../../context/ModalContext';
import { abastecimentosService } from '../services/abastecimentosService';
import type { AbastecimentoFormData } from '../types';

export function useAbastecimentos() {
    const queryClient = useQueryClient();
    const { showFeedback } = useModal();

    const { data: abastecimentos = [], isLoading, error, refetch } = useQuery({
        queryKey: queryKeys.frota.abastecimentos.lists(),
        queryFn: abastecimentosService.getAbastecimentos,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const createMutation = useMutation({
        mutationFn: abastecimentosService.createAbastecimento,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.frota.abastecimentos.all });
            showFeedback('success', 'Abastecimento lançado com sucesso!');
        },
        onError: (error) => {
            console.error('Error creating abastecimento:', error);
            showFeedback('error', 'Erro ao lançar abastecimento.');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AbastecimentoFormData> }) =>
            abastecimentosService.updateAbastecimento(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.frota.abastecimentos.all });
            showFeedback('success', 'Abastecimento atualizado com sucesso!');
        },
        onError: (error) => {
            console.error('Error updating abastecimento:', error);
            showFeedback('error', 'Erro ao atualizar abastecimento.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: abastecimentosService.deleteAbastecimento,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.frota.abastecimentos.all });
            showFeedback('success', 'Abastecimento excluído com sucesso!');
        },
        onError: (error) => {
            console.error('Error deleting abastecimento:', error);
            showFeedback('error', 'Erro ao excluir abastecimento.');
        }
    });

    return {
        abastecimentos,
        isLoading,
        error,
        refetch,
        createAbastecimento: createMutation.mutateAsync,
        updateAbastecimento: updateMutation.mutateAsync,
        deleteAbastecimento: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending
    };
}
