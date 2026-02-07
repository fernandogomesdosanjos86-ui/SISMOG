export const APP_ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REPORTS: '/reports',
    ANALYTICS: '/analytics',
    USERS: '/users',
    FINANCEIRO: {
        ROOT: '#financeiro',
        CONTRATOS: '/financeiro/contratos',
        FATURAMENTOS: '/financeiro/faturamentos',
        RECEBIMENTOS: '/financeiro/recebimentos',
    },
    ESTOQUE: {
        ROOT: '#estoque',
        EQUIPAMENTOS: '/estoque/equipamentos',
    },
    RH: {
        ROOT: '#rh',
        CARGOS_SALARIOS: '/rh/cargos-salarios',
    }
} as const;
