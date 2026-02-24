import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { penalidadesService } from '../../../services/penalidadesService';
import type { PenalidadeFormData } from '../types';
import { useModal } from '../../../context/ModalContext';

export function usePenalidades() {
    const queryClient = useQueryClient();
    const { showFeedback } = useModal();

    const query = useQuery({
        queryKey: ['penalidades'],
        queryFn: penalidadesService.getPenalidades
    });

    const createMutation = useMutation({
        mutationFn: ({ data, file }: { data: PenalidadeFormData, file?: File | null }) =>
            penalidadesService.createPenalidade(data, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['penalidades'] });
            showFeedback('success', 'Penalidade registrada com sucesso!');
        },
        onError: (error) => {
            console.error('Error creating penalidade:', error);
            showFeedback('error', 'Erro ao registrar penalidade. Tente novamente.');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data, file, existingFileUrl }: { id: string, data: Partial<PenalidadeFormData>, file?: File | null, existingFileUrl?: string }) =>
            penalidadesService.updatePenalidade(id, data, file, existingFileUrl),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['penalidades'] });
            showFeedback('success', 'Penalidade atualizada com sucesso!');
        },
        onError: (error) => {
            console.error('Error updating penalidade:', error);
            showFeedback('error', 'Erro ao atualizar penalidade. Tente novamente.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: ({ id, fileUrl }: { id: string, fileUrl?: string }) =>
            penalidadesService.deletePenalidade(id, fileUrl),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['penalidades'] });
            showFeedback('success', 'Penalidade removida com sucesso!');
        },
        onError: (error) => {
            console.error('Error deleting penalidade:', error);
            showFeedback('error', 'Erro ao remover penalidade. Tente novamente.');
        }
    });

    return {
        penalidades: query.data ?? [],
        isLoading: query.isLoading,
        error: query.error,
        createPenalidade: createMutation.mutateAsync,
        updatePenalidade: updateMutation.mutateAsync,
        deletePenalidade: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending
    };
}
