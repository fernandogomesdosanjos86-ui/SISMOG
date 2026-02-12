import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supervisaoService } from '../../../services/supervisaoService';
import { queryKeys } from '../../../lib/queryClient';
import type { AlocacaoFormData } from '../types';
import { useModal } from '../../../context/ModalContext';

export function useAlocacoes(postoId: string) {
    const queryClient = useQueryClient();
    const { showFeedback } = useModal();

    const query = useQuery({
        queryKey: queryKeys.postos.alocacoes(postoId),
        queryFn: async () => {
            const data = await supervisaoService.getAlocacoes(postoId);
            return data.sort((a, b) => {
                // 1. Sort by Type: Official (he=false) comes before Extra (he=true)
                if (a.he !== b.he) return a.he ? 1 : -1;
                // 2. Sort by Name: Alphabetical
                const nomeA = a.funcionario?.nome || '';
                const nomeB = b.funcionario?.nome || '';
                return nomeA.localeCompare(nomeB);
            });
        },
        enabled: !!postoId,
    });

    const createMutation = useMutation({
        mutationFn: (data: AlocacaoFormData) => supervisaoService.createAlocacao(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.postos.alocacoes(postoId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.postos.list() }); // Update counts
            showFeedback('success', 'Funcionário alocado com sucesso!');
        },
        onError: (error: any) => {
            console.error('Erro ao alocar funcionário:', error);
            showFeedback('error', error.message || 'Erro ao alocar funcionário.');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AlocacaoFormData> }) =>
            supervisaoService.updateAlocacao(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.postos.alocacoes(postoId) });
            showFeedback('success', 'Alocação atualizada com sucesso!');
        },
        onError: (error) => {
            console.error('Erro ao atualizar alocação:', error);
            showFeedback('error', 'Erro ao atualizar alocação.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => supervisaoService.deleteAlocacao(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.postos.alocacoes(postoId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.postos.list() }); // Update counts
            showFeedback('success', 'Alocação removida com sucesso!');
        },
        onError: (error) => {
            console.error('Erro ao remover alocação:', error);
            showFeedback('error', 'Erro ao remover alocação.');
        }
    });

    return {
        alocacoes: query.data ?? [],
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
