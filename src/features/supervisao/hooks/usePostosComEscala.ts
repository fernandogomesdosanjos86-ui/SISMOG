import { useQuery } from '@tanstack/react-query';
import { escalasService } from '../../../services/escalasService';
import { queryKeys } from '../../../lib/queryClient';

export function usePostosComEscala(competencia: string) {
    return useQuery({
        queryKey: queryKeys.escalas.postosComEscala(competencia),
        queryFn: () => escalasService.getPostosComEscala(competencia),
        enabled: !!competencia,
    });
}
