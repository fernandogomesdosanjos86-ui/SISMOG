import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checklistsService } from '../services/checklistsService';
import { queryKeys } from '../../../lib/queryClient';
import { useModal } from '../../../context/ModalContext';
import type { ChecklistFormData, ChecklistsFilters } from '../types';

export function useChecklists(filters?: ChecklistsFilters) {
    const queryClient = useQueryClient();
    const { showFeedback } = useModal();

    const {
        data: checklistsData,
        isLoading,
        error
    } = useQuery({
        queryKey: [...queryKeys.frota.checklists.all, filters],
        queryFn: () => checklistsService.getChecklists(filters || { page: 1, pageSize: 15 }),
        staleTime: 1000 * 60 * 5,
    });

    const createMutation = useMutation({
        mutationFn: (data: ChecklistFormData) => checklistsService.createChecklist(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.frota.checklists.all });
            showFeedback('success', 'Checklist lançado com sucesso!');
        },
        onError: (err) => {
            console.error('Erro ao criar checklist:', err);
            showFeedback('error', 'Erro ao salvar checklist. Tente novamente.');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ChecklistFormData> }) =>
            checklistsService.updateChecklist(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.frota.checklists.all });
            showFeedback('success', 'Checklist atualizado com sucesso!');
        },
        onError: (error) => {
            console.error('Error updating checklist:', error);
            showFeedback('error', 'Erro ao atualizar checklist');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => checklistsService.deleteChecklist(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.frota.checklists.all });
            showFeedback('success', 'Checklist excluído com sucesso!');
        },
        onError: (error) => {
            console.error('Error deleting checklist:', error);
            showFeedback('error', 'Erro ao excluir checklist');
        }
    });

    return {
        checklists: checklistsData?.data || [],
        totalPages: checklistsData?.totalPages || 0,
        totalCount: checklistsData?.count || 0,
        isLoading,
        error,
        createChecklist: createMutation.mutateAsync,
        updateChecklist: updateMutation.mutateAsync,
        deleteChecklist: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
