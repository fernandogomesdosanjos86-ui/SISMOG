import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apontamentosService } from '../../../services/apontamentosService';
import { queryKeys } from '../../../lib/queryClient';
import type { ApontamentoFormData } from '../types';
import { useModal } from '../../../context/ModalContext';

export function useApontamentos(month: number, year: number) {
    const queryClient = useQueryClient();
    const { showFeedback } = useModal();

    const query = useQuery({
        queryKey: queryKeys.apontamentos.list(month, year),
        queryFn: () => apontamentosService.getApontamentos(month, year),
    });

    const createMutation = useMutation({
        mutationFn: (data: ApontamentoFormData) => apontamentosService.createApontamento(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.apontamentos.list(month, year) });
            showFeedback('success', 'Apontamento registrado com sucesso!');
        },
        onError: (error: any) => {
            console.error('Erro ao registrar apontamento:', error);
            showFeedback('error', error.message || 'Erro ao registrar apontamento.');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ApontamentoFormData> }) =>
            apontamentosService.updateApontamento(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.apontamentos.list(month, year) });
            showFeedback('success', 'Apontamento atualizado com sucesso!');
        },
        onError: (error: any) => {
            console.error('Erro ao atualizar apontamento:', error);
            showFeedback('error', error.message || 'Erro ao atualizar apontamento.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apontamentosService.deleteApontamento(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.apontamentos.list(month, year) });
            showFeedback('success', 'Apontamento removido com sucesso!');
        },
        onError: (error: any) => {
            console.error('Erro ao remover apontamento:', error);
            showFeedback('error', error.message || 'Erro ao remover apontamento.');
        }
    });

    return {
        apontamentos: query.data ?? [],
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
