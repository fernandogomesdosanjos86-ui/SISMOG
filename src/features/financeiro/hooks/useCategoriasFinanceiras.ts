import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeiroService } from '../../../services/financeiroService';
import { queryKeys } from '../../../lib/queryClient';
import type { CategoriaFinanceiraFormData, StatusCategoriaFinanceira, CategoriaComSubcategorias } from '../types';

export function useCategoriasFinanceiras() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.categoriasFinanceiras.list(),
        queryFn: () => financeiroService.getCategoriasFinanceiras(),
    });

    const createMutation = useMutation({
        mutationFn: (data: CategoriaFinanceiraFormData) => financeiroService.createCategoriaFinanceira(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.categoriasFinanceiras.all });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CategoriaFinanceiraFormData> }) =>
            financeiroService.updateCategoriaFinanceira(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.categoriasFinanceiras.all });
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: StatusCategoriaFinanceira }) =>
            financeiroService.toggleStatusCategoriaFinanceira(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.categoriasFinanceiras.all });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => financeiroService.deleteCategoriaFinanceira(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.categoriasFinanceiras.all });
        },
    });

    // Monta a estrutura hierárquica (Categoria Principal com suas Subcategorias)
    const arvoreCategorias: CategoriaComSubcategorias[] = useMemo(() => {
        const raw = query.data ?? [];
        const pais = raw.filter((c) => !c.parent_id);
        const filhas = raw.filter((c) => !!c.parent_id);

        return pais.map((pai) => ({
            ...pai,
            subcategorias: filhas.filter((f) => f.parent_id === pai.id)
        }));
    }, [query.data]);

    const categoriasPrincipais = useMemo(() => {
        return (query.data ?? []).filter((c) => !c.parent_id);
    }, [query.data]);

    return {
        categorias: query.data ?? [],
        arvoreCategorias,
        categoriasPrincipais,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
        createCategoria: createMutation.mutateAsync,
        updateCategoria: updateMutation.mutateAsync,
        toggleStatus: toggleStatusMutation.mutateAsync,
        deleteCategoria: deleteMutation.mutateAsync,
        isSubmitting:
            createMutation.isPending ||
            updateMutation.isPending ||
            toggleStatusMutation.isPending ||
            deleteMutation.isPending,
    };
}
