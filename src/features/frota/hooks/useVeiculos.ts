import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { veiculosService } from '../services/veiculosService';
import { useModal } from '../../../context/ModalContext';
import { queryKeys } from '../../../lib/queryClient';
import type { VeiculoFormData } from '../types';

export const useVeiculos = () => {
    const queryClient = useQueryClient();
    const { showFeedback } = useModal();

    const queryKey = queryKeys.frota.veiculos;

    const {
        data: veiculos = [],
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey,
        queryFn: veiculosService.getVeiculos,
    });

    const createMutation = useMutation({
        mutationFn: veiculosService.createVeiculo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            showFeedback('success', 'Veículo cadastrado com sucesso!');
        },
        onError: (error) => {
            console.error('Erro ao cadastrar veículo:', error);
            showFeedback('error', 'Erro ao cadastrar veículo. Verifique se a placa já existe.');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<VeiculoFormData> }) =>
            veiculosService.updateVeiculo(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            showFeedback('success', 'Veículo atualizado com sucesso!');
        },
        onError: (error) => {
            console.error('Erro ao atualizar veículo:', error);
            showFeedback('error', 'Erro ao atualizar veículo.');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: veiculosService.deleteVeiculo,
        onSuccess: () => {
            // Optimistic update ou invalidate
            queryClient.invalidateQueries({ queryKey });
            showFeedback('success', 'Veículo excluído com sucesso!');
        },
        onError: (error) => {
            console.error('Erro ao excluir veículo:', error);
            showFeedback('error', 'Erro ao excluir veículo.');
        }
    });

    return {
        veiculos,
        isLoading,
        error,
        refetch,
        createVeiculo: createMutation.mutateAsync,
        updateVeiculo: updateMutation.mutateAsync,
        deleteVeiculo: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending
    };
};
