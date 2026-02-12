import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicosExtrasService } from '../../../services/servicosExtrasService';
import { queryKeys } from '../../../lib/queryClient';
import type { ServicoExtraFormData } from '../types';
import { useModal } from '../../../context/ModalContext';

export function useServicosExtras(month: number, year: number) {
    const queryClient = useQueryClient();
    const { showFeedback } = useModal();

    const query = useQuery({
        queryKey: queryKeys.servicosExtras.list(month, year),
        queryFn: () => servicosExtrasService.getServicos(month, year),
    });

    const createMutation = useMutation({
        mutationFn: (data: ServicoExtraFormData) => servicosExtrasService.createServico(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.servicosExtras.list(month, year) });
            showFeedback('success', 'Serviço extra registrado com sucesso!');
        },
        onError: (error: any) => {
            console.error('Erro ao registrar serviço:', error);
            showFeedback('error', error.message || 'Erro ao registrar serviço.');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: ServicoExtraFormData }) =>
            servicosExtrasService.updateServicoWithCalculation(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.servicosExtras.list(month, year) });
            showFeedback('success', 'Serviço atualizado com sucesso!');
        },
        onError: (error: any) => {
            console.error('Erro ao atualizar serviço:', error);
            showFeedback('error', error.message || 'Erro ao atualizar serviço.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => servicosExtrasService.deleteServico(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.servicosExtras.list(month, year) });
            showFeedback('success', 'Serviço removido com sucesso!');
        },
        onError: (error: any) => {
            console.error('Erro ao remover serviço:', error);
            showFeedback('error', error.message || 'Erro ao remover serviço.');
        }
    });

    return {
        servicos: query.data ?? [],
        isLoading: query.isLoading,
        refetch: query.refetch,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        delete: deleteMutation.mutateAsync,
    };
}
