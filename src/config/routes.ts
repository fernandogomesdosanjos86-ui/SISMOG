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
        GESTAO_ESTOQUE: '/estoque/gestao',
    },
    RH: {
        ROOT: '#rh',
        CARGOS_SALARIOS: '/rh/cargos-salarios',
        FUNCIONARIOS: '/rh/funcionarios',
        PENALIDADES: '/rh/penalidades',
        GRATIFICACOES: '/rh/gratificacoes',
    },
    SUPERVISAO: {
        ROOT: '#supervisao',
        POSTOS: '/supervisao/postos',
        SERVICOS_EXTRAS: '/supervisao/servicos-extras',
        APONTAMENTOS: '/supervisao/apontamentos',
        ESCALAS: '/supervisao/escalas',
    },
    FROTA: {
        ROOT: '#frota',
        VEICULOS: '/frota/veiculos',
        ABASTECIMENTOS: '/frota/abastecimentos',
        CHECKLISTS: '/frota/checklists',
        MOVIMENTACOES: '/frota/movimentacoes',
    },
    GERAL: {
        ROOT: '#geral',
        CURRICULOS: '/geral/curriculos',
        TAREFAS: '/geral/tarefas',
    },
    PORTAL_COLABORADOR: '/portal-colaborador'
} as const;
