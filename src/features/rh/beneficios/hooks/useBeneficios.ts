import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../services/supabase';
import type { BeneficioCalculado } from '../types';

export function useBeneficios(competencia?: string, companyFilter?: 'TODOS' | 'FEMOG' | 'SEMOG') {
    const queryClient = useQueryClient();

    const { data: beneficios = [], isLoading, error, refetch } = useQuery({
        queryKey: ['beneficios', competencia, companyFilter],
        queryFn: async () => {
            let query = supabase
                .from('rh_beneficios_calculados')
                .select(`
                    *,
                    funcionarios (nome, cpf),
                    postos_trabalho (nome),
                    cargos_salarios (cargo)
                `)
                .order('created_at', { ascending: false });

            if (competencia) {
                query = query.eq('competencia', competencia);
            }
            if (companyFilter && companyFilter !== 'TODOS') {
                query = query.eq('empresa', companyFilter);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data as BeneficioCalculado[];
        },
    });

    const deleteBeneficio = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('rh_beneficios_calculados')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['beneficios'] });
        },
    });

    const updateBeneficio = useMutation({
        mutationFn: async (payload: Partial<BeneficioCalculado> & { id: string }) => {
            const { id, total_dias, funcionarios, postos_trabalho, cargos_salarios, created_at, ...dataToUpdate } = payload as any;
            const { error } = await supabase
                .from('rh_beneficios_calculados')
                .update(dataToUpdate)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['beneficios'] });
        },
    });

    return {
        beneficios,
        isLoading,
        error,
        refetch,
        deleteBeneficio: deleteBeneficio.mutateAsync,
        updateBeneficio: updateBeneficio.mutateAsync,
        isDeleting: deleteBeneficio.isPending,
        isUpdating: updateBeneficio.isPending
    };
}
