import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { curriculoService } from '../services/curriculoService';
import { queryKeys } from '../../../../lib/queryClient';
import type { CurriculoFormData } from '../types';

export function useCurriculos() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.curriculos.list(),
        queryFn: () => curriculoService.getCurriculos(),
    });

    const createMutation = useMutation({
        mutationFn: (data: CurriculoFormData) => curriculoService.createCurriculo(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.curriculos.all }),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CurriculoFormData> }) =>
            curriculoService.updateCurriculo(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.curriculos.all }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => curriculoService.deleteCurriculo(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.curriculos.all }),
    });

    return {
        curriculos: query.data ?? [],
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
