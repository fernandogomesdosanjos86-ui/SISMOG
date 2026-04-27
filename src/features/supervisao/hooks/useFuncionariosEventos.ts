import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { funcionariosEventosService } from '../../../services/funcionariosEventosService';
import type { FuncionarioEventoFormData } from '../types';

export function useFuncionariosEventos() {
    const queryClient = useQueryClient();

    const { data: funcionariosEventos = [], isLoading, error, refetch } = useQuery({
        queryKey: ['funcionariosEventos'],
        queryFn: () => funcionariosEventosService.getFuncionariosEventos(),
    });

    const createMutation = useMutation({
        mutationFn: (data: FuncionarioEventoFormData) => funcionariosEventosService.createFuncionarioEvento(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['funcionariosEventos'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<FuncionarioEventoFormData> }) =>
            funcionariosEventosService.updateFuncionarioEvento(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['funcionariosEventos'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => funcionariosEventosService.deleteFuncionarioEvento(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['funcionariosEventos'] });
        },
    });

    return {
        funcionariosEventos,
        isLoading,
        error,
        refetch,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        delete: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
