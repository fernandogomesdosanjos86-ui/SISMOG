import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
            retry: 2,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
        mutations: {
            retry: 1,
        },
    },
});

// Query keys factory for type-safe cache invalidation
export const queryKeys = {
    // Financeiro
    contratos: {
        all: ['contratos'] as const,
        list: () => [...queryKeys.contratos.all, 'list'] as const,
        detail: (id: string) => [...queryKeys.contratos.all, 'detail', id] as const,
    },
    faturamentos: {
        all: ['faturamentos'] as const,
        list: (competencia: string) => [...queryKeys.faturamentos.all, 'list', competencia] as const,
        detail: (id: string) => [...queryKeys.faturamentos.all, 'detail', id] as const,
    },
    recebimentos: {
        all: ['recebimentos'] as const,
        list: () => [...queryKeys.recebimentos.all, 'list'] as const,
        detail: (id: string) => [...queryKeys.recebimentos.all, 'detail', id] as const,
    },
    // Estoque
    equipamentos: {
        all: ['equipamentos'] as const,
        list: () => [...queryKeys.equipamentos.all, 'list'] as const,
        detail: (id: string) => [...queryKeys.equipamentos.all, 'detail', id] as const,
        destinacoes: () => [...queryKeys.equipamentos.all, 'destinacoes'] as const,
    },
    // RH
    cargosSalarios: {
        all: ['cargosSalarios'] as const,
        list: () => [...queryKeys.cargosSalarios.all, 'list'] as const,
        detail: (id: string) => [...queryKeys.cargosSalarios.all, 'detail', id] as const,
    },
} as const;
