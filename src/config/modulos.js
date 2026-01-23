// Configuração centralizada de módulos do sistema
// Usado por: Sidebar, Accordion de Permissões, Verificação de Acesso

export const MODULOS_SISTEMA = [
    // Módulos simples (sem submódulos)
    {
        modulo: 'dashboard',
        label: 'Dashboard',
        icon: 'LayoutDashboard',
        rota: '/',
        submodulos: null
    },
    {
        modulo: 'curriculos',
        label: 'Currículos',
        icon: 'FileUser',
        rota: '/curriculos',
        submodulos: null
    },
    {
        modulo: 'compras',
        label: 'Compras',
        icon: 'ShoppingCart',
        rota: '/compras',
        submodulos: null
    },
    {
        modulo: 'tarefas',
        label: 'Tarefas',
        icon: 'CheckSquare',
        rota: '/tarefas',
        submodulos: null
    },
    {
        modulo: 'intranet',
        label: 'Intranet',
        icon: 'Globe',
        rota: '/intranet',
        submodulos: null
    },
    {
        modulo: 'direcao',
        label: 'Direção',
        icon: 'Crown',
        rota: '/direcao',
        submodulos: null
    },
    {
        modulo: 'frota',
        label: 'Frota',
        icon: 'Car',
        rota: '/frota',
        submodulos: null
    },
    {
        modulo: 'formularios',
        label: 'Formulários',
        icon: 'ClipboardList',
        rota: '/formularios',
        submodulos: null
    },

    // Módulos com submódulos
    {
        modulo: 'estoque',
        label: 'Estoque',
        icon: 'Package',
        rota: '/estoque',
        submodulos: [
            { key: 'controle_estoque', label: 'Controle de Estoque', rota: '/estoque/controle' },
            { key: 'equipamentos_controlados', label: 'Equipamentos Controlados', rota: '/estoque/equipamentos' }
        ]
    },
    {
        modulo: 'departamento_pessoal',
        label: 'Departamento Pessoal',
        icon: 'Users',
        rota: '/dp',
        submodulos: [
            { key: 'funcionarios', label: 'Funcionários', rota: '/dp/funcionarios' },
            { key: 'cargos_salarios', label: 'Cargos e Salários', rota: '/dp/cargos-salarios' },
            { key: 'folha_pagamento', label: 'Folha de Pagamento', rota: '/dp/folha' }
        ]
    },
    {
        modulo: 'supervisao',
        label: 'Supervisão',
        icon: 'Eye',
        rota: '/supervisao',
        submodulos: [
            { key: 'gestao_postos', label: 'Gestão de Postos', rota: '/supervisao/gestao-postos' },
            { key: 'postos_trabalho', label: 'Postos de Trabalho', rota: '/supervisao/postos' },
            { key: 'escalas', label: 'Escalas', rota: '/supervisao/escalas' },
            { key: 'servicos_extras', label: 'Serviços Extras', rota: '/supervisao/servicos-extras' }
        ]
    },
    {
        modulo: 'financeiro',
        label: 'Financeiro',
        icon: 'DollarSign',
        rota: '/financeiro',
        submodulos: [
            { key: 'contratos', label: 'Contratos', rota: '/financeiro/contratos' },
            { key: 'faturamentos', label: 'Faturamentos', rota: '/financeiro/faturamentos' },
            { key: 'recebimentos', label: 'Recebimentos', rota: '/financeiro/recebimentos' },
            { key: 'tributos', label: 'Tributos', rota: '/financeiro/tributos' }
        ]
    },
    {
        modulo: 'configuracoes',
        label: 'Configurações',
        icon: 'Settings',
        rota: '/config',
        submodulos: [
            { key: 'usuarios', label: 'Usuários', rota: '/config/usuarios' },
            { key: 'empresas', label: 'Empresas', rota: '/config/empresas' },
            { key: 'contas_correntes', label: 'Contas Correntes', rota: '/config/contas' },
            { key: 'cartoes_credito', label: 'Cartões de Crédito', rota: '/config/cartoes' }
        ]
    }
];

// Helper: buscar módulo por key
export const getModulo = (moduloKey) => {
    return MODULOS_SISTEMA.find(m => m.modulo === moduloKey);
};

// Helper: buscar submódulo
export const getSubmodulo = (moduloKey, submoduloKey) => {
    const modulo = getModulo(moduloKey);
    return modulo?.submodulos?.find(s => s.key === submoduloKey);
};

// Helper: listar todos os módulos para o Accordion de permissões
export const getModulosParaPermissoes = () => {
    return MODULOS_SISTEMA.map(m => ({
        modulo: m.modulo,
        label: m.label,
        submodulos: m.submodulos
    }));
};

// Helper: listar módulos para o Sidebar
export const getModulosParaSidebar = () => {
    return MODULOS_SISTEMA.map(m => ({
        modulo: m.modulo,
        label: m.label,
        icon: m.icon,
        rota: m.rota,
        submodulos: m.submodulos?.map(s => ({
            key: s.key,
            label: s.label,
            rota: s.rota
        }))
    }));
};

// Níveis de permissão disponíveis
export const NIVEIS_PERMISSAO = [
    { value: 'sem_acesso', label: 'Sem Acesso' },
    { value: 'visualizar', label: 'Visualizar' },
    { value: 'gerenciar', label: 'Gerenciar' },
    { value: 'gerenciar_total', label: 'Gerenciar Total' }
];
