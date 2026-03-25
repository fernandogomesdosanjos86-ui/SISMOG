import {
    Home, Settings, Users, FileText, BarChart2, DollarSign, Box, Briefcase, Package,
    Calendar, AlertTriangle, Award, Car, Droplet, ClipboardCheck, MapPin, PieChart, Handshake
} from 'lucide-react';
import { APP_ROUTES } from '../../config/routes';

export type NavItem = {
    icon: React.ComponentType<{ size?: number }>;
    label: string;
    path: string;
    children?: { icon: React.ComponentType<{ size?: number }>; label: string; path: string }[];
    hasAccess?: (user: any) => boolean;
};

export const navItems: NavItem[] = [
    { icon: Home, label: 'Dashboard', path: APP_ROUTES.HOME },
    {
        icon: FileText,
        label: 'Geral',
        path: APP_ROUTES.GERAL.ROOT,
        children: [
            { icon: AlertTriangle, label: 'Tarefas', path: APP_ROUTES.GERAL.TAREFAS },
            { icon: FileText, label: 'Currículos', path: APP_ROUTES.GERAL.CURRICULOS }
        ]
    },
    {
        icon: Box,
        label: 'Estoque',
        path: APP_ROUTES.ESTOQUE.ROOT,
        children: [
            { icon: FileText, label: 'Equip. Controlados', path: APP_ROUTES.ESTOQUE.EQUIPAMENTOS },
            { icon: Package, label: 'Gestão de Estoque', path: APP_ROUTES.ESTOQUE.GESTAO_ESTOQUE }
        ]
    },
    {
        icon: Briefcase,
        label: 'Dep. Pessoal',
        path: APP_ROUTES.RH.ROOT,
        children: [
            { icon: FileText, label: 'Cargos e Salários', path: APP_ROUTES.RH.CARGOS_SALARIOS },
            { icon: Users, label: 'Funcionários', path: APP_ROUTES.RH.FUNCIONARIOS },
            { icon: DollarSign, label: 'Benefícios', path: APP_ROUTES.RH.BENEFICIOS },
            { icon: AlertTriangle, label: 'Penalidades', path: APP_ROUTES.RH.PENALIDADES },
            { icon: Award, label: 'Gratificações', path: APP_ROUTES.RH.GRATIFICACOES }
        ]
    },
    {
        icon: Users,
        label: 'Supervisão',
        path: APP_ROUTES.SUPERVISAO.ROOT,
        children: [
            { icon: FileText, label: 'Gestão de Postos', path: APP_ROUTES.SUPERVISAO.POSTOS },
            { icon: DollarSign, label: 'Serviços Extras', path: APP_ROUTES.SUPERVISAO.SERVICOS_EXTRAS },
            { icon: FileText, label: 'Apontamentos', path: APP_ROUTES.SUPERVISAO.APONTAMENTOS },
            { icon: Calendar, label: 'Escalas', path: APP_ROUTES.SUPERVISAO.ESCALAS },
            { icon: Handshake, label: 'Troca de Plantão', path: APP_ROUTES.SUPERVISAO.TROCA_PLANTAO }
        ]
    },
    {
        icon: Car,
        label: 'Gestão de Frota',
        path: APP_ROUTES.FROTA.ROOT,
        children: [
            { icon: Car, label: 'Veículos', path: APP_ROUTES.FROTA.VEICULOS },
            { icon: MapPin, label: 'Movimentações', path: APP_ROUTES.FROTA.MOVIMENTACOES },
            { icon: Droplet, label: 'Abastecimentos', path: APP_ROUTES.FROTA.ABASTECIMENTOS },
            { icon: ClipboardCheck, label: 'Checklists', path: APP_ROUTES.FROTA.CHECKLISTS },
            { icon: PieChart, label: 'Relatório Frota', path: APP_ROUTES.FROTA.RELATORIOS }
        ]
    },
    {
        icon: DollarSign,
        label: 'Financeiro',
        path: APP_ROUTES.FINANCEIRO.ROOT,
        hasAccess: (user: any) => {
            const p = user?.user_metadata?.permissao?.toLowerCase();
            const s = user?.user_metadata?.setor?.toLowerCase();
            if (p === 'adm') return true;
            if (p === 'gestor' && (s === 'financeiro' || s === 'direção')) return true;
            return false;
        },
        children: [
            { icon: FileText, label: 'Contratos', path: APP_ROUTES.FINANCEIRO.CONTRATOS },
            { icon: BarChart2, label: 'Faturamentos', path: APP_ROUTES.FINANCEIRO.FATURAMENTOS },
            { icon: Users, label: 'Recebimentos', path: APP_ROUTES.FINANCEIRO.RECEBIMENTOS },
            { icon: PieChart, label: 'Relatório Financeiro', path: APP_ROUTES.FINANCEIRO.RELATORIOS }
        ]
    },
    {
        icon: Settings,
        label: 'Configurações',
        path: '#',
        children: [
            { icon: Users, label: 'Usuários', path: APP_ROUTES.USERS },
        ]
    }
];
