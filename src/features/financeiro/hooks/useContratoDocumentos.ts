import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeiroService } from '../../../services/financeiroService';
import { queryKeys, STALE_TIMES } from '../../../lib/queryClient';
import type { ContratoDocumentoFormData } from '../types';

export function useContratoDocumentos(contratoId: string) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.contratos.documentos(contratoId),
        queryFn: () => financeiroService.getDocumentosPorContrato(contratoId),
        staleTime: STALE_TIMES.MODERATE,
        enabled: !!contratoId,
    });

    const createMutation = useMutation({
        mutationFn: async ({ file, descricao }: { file: File, descricao: string }) => {
            // 1. Fazer upload do arquivo pro Storage
            const arquivoUrl = await financeiroService.uploadDocumentoContrato(file);
            
            // 2. Salvar registro no banco
            const formData: ContratoDocumentoFormData = {
                contrato_id: contratoId,
                descricao,
                arquivo_url: arquivoUrl
            };
            return financeiroService.createDocumentoContrato(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.contratos.documentos(contratoId) });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: ({ id, arquivoUrl }: { id: string, arquivoUrl: string }) => 
            financeiroService.deleteDocumentoContrato(id, arquivoUrl),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.contratos.documentos(contratoId) });
        },
    });

    return {
        documentos: query.data ?? [],
        isLoading: query.isLoading,
        refetch: query.refetch,
        create: createMutation.mutateAsync,
        delete: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
