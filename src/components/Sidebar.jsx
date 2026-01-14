import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home, Users, Settings, FileText, Truck, DollarSign, Briefcase,
    ChevronLeft, Menu, LogOut, Disc, CreditCard, Package,
    LayoutGrid, ClipboardList, Globe, AlertTriangle, Award,
    FileSpreadsheet, Heart, Calendar, RefreshCw, TrendingDown,
    Activity, Landmark, ClipboardCheck, BarChart, Shield, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import logoHome from '../assets/logo-home.png';

const Sidebar = () => {
    const location = useLocation();
    const { user, signOut } = useAuth();
    const [dbUserName, setDbUserName] = useState('');
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Estrutura de Menu (Hierarquia Nova com DNA Antigo)
    const menuItems = useMemo(() => [
        { title: 'Início', path: '/', icon: <Home size={18} /> },
        {
            title: 'Geral',
            icon: <LayoutGrid size={18} />,
            submenu: [
                { title: 'Controle de Estoque', path: '/estoque', icon: <Package size={16} /> },
                { title: 'Equipamentos Controlados', path: '/equipamentos-controlados', icon: <Disc size={16} /> },
                { title: 'Tarefas', path: '/tarefas', icon: <ClipboardList size={16} />, disabled: true },
                { title: 'Intranet', path: '/intranet', icon: <Globe size={16} />, disabled: true },
                { title: 'Currículos', path: '/curriculos', icon: <FileText size={16} /> },
            ]
        },
        {
            title: 'Departamento Pessoal',
            icon: <Users size={18} />,
            submenu: [
                { title: 'Cargos e Salários', path: '/cargos-salarios', icon: <Briefcase size={16} /> },
                { title: 'Postos de Trabalho', path: '/postos-trabalho', icon: <Briefcase size={16} /> },
                { title: 'Funcionários', path: '/funcionarios', icon: <Users size={16} /> },
                { title: 'Penalidades', path: '/penalidades', icon: <AlertTriangle size={16} /> },
                { title: 'Gratificações', path: '/gratificacoes', icon: <Award size={16} />, disabled: true },
                { title: 'Folha de Pagamento', path: '/folha-pagamento', icon: <FileSpreadsheet size={16} />, disabled: true },
                { title: 'Benefícios', path: '/beneficios', icon: <Heart size={16} />, disabled: true },
            ]
        },
        {
            title: 'Supervisão',
            icon: <Shield size={18} />,
            submenu: [
                { title: 'Apontamentos', path: '/apontamentos', icon: <ClipboardList size={16} />, disabled: true },
                { title: 'Escalas', path: '/escalas', icon: <Calendar size={16} />, disabled: true },
                { title: 'Trocas de Plantão', path: '/trocas-plantao', icon: <RefreshCw size={16} />, disabled: true },
                { title: 'Serviços Extras', path: '/servicos-extras', icon: <Briefcase size={16} />, disabled: true },
            ]
        },
        {
            title: 'Financeiro',
            icon: <DollarSign size={18} />,
            submenu: [
                { title: 'Contratos', path: '/contratos', icon: <FileText size={16} /> },
                { title: 'Faturamentos', path: '/faturamentos', icon: <DollarSign size={16} /> },
                { title: 'Recebimentos', path: '/recebimentos', icon: <DollarSign size={16} /> },
                { title: 'Controle de Despesas', path: '/controle-despesas', icon: <TrendingDown size={16} /> },
                { title: 'Movimentação Financeira', path: '/movimentacao-financeira', icon: <Activity size={16} />, disabled: true },
                { title: 'Tributos', path: '/tributos', icon: <Landmark size={16} />, disabled: true },
            ]
        },
        {
            title: 'Frota',
            icon: <Truck size={18} />,
            submenu: [
                { title: 'Veículos', path: '/veiculos', icon: <Truck size={16} />, disabled: true },
                { title: 'Checklist Veicular', path: '/checklist-veicular', icon: <ClipboardCheck size={16} />, disabled: true },
                { title: 'Movimentação Veicular', path: '/movimentacao-veicular', icon: <Activity size={16} />, disabled: true },
            ]
        },
        {
            title: 'Direção',
            icon: <Menu size={18} />,
            submenu: [
                { title: 'Usuários', path: '/usuarios', icon: <Users size={16} /> },
                { title: 'Empresas', path: '/empresas', icon: <Briefcase size={16} /> },
                { title: 'Contas Correntes', path: '/financeiro/contas', icon: <DollarSign size={16} /> },
                { title: 'Cartões de Crédito', path: '/financeiro/cartoes', icon: <CreditCard size={16} /> }
            ]
        },
        { title: 'Relatórios', path: '/relatorios', icon: <BarChart size={18} />, disabled: true },
        { title: 'Formulários', path: '/formularios', icon: <ClipboardList size={18} />, disabled: true },
    ], []);

    // Controle de Submenus
    const [openSubmenus, setOpenSubmenus] = useState(() => {
        const initialState = {};
        menuItems.forEach(item => {
            if (item.submenu) {
                const isActive = item.submenu.some(sub => location.pathname.startsWith(sub.path));
                if (isActive) initialState[item.title] = true;
            }
        });
        return initialState;
    });

    useEffect(() => {
        const newOpenState = { ...openSubmenus };
        menuItems.forEach(item => {
            if (item.submenu) {
                const isActive = item.submenu.some(sub => location.pathname.startsWith(sub.path));
                if (isActive) newOpenState[item.title] = true;
            }
        });
        setOpenSubmenus(newOpenState);
        setIsMobileOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const fetchUserName = async () => {
            if (!user?.email) return;
            try {
                const { data, error } = await supabase.from('usuarios').select('nome').eq('email', user.email).maybeSingle();
                if (!error && data) setDbUserName(data.nome);
            } catch (err) { console.error(err); }
        };
        fetchUserName();
    }, [user]);

    const handleLogout = async () => { await signOut(); };
    const toggleSubmenu = (title) => {
        setOpenSubmenus(prev => {
            // Verifica se o menu clicado já está aberto
            const isCurrentlyOpen = !!prev[title];

            // Se estava aberto, retorna objeto vazio (fecha tudo).
            // Se estava fechado, retorna objeto apenas com ele true (fecha os outros implicitamente).
            return isCurrentlyOpen ? {} : { [title]: true };
        });
    };

    return (
        <>
            <style>{`
                /* Oculta a barra de rolagem no Chrome, Safari e Opera */
                .custom-sidebar-scroll::-webkit-scrollbar {
                    display: none;
                }
                
                /* Oculta a barra de rolagem no Firefox e IE/Edge antigo */
                .custom-sidebar-scroll {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}</style>

            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="md:hidden fixed top-4 right-4 z-[60] p-2 bg-slate-900 text-white rounded-lg shadow-lg border border-slate-700"
            >
                {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {isMobileOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[55] md:hidden" onClick={() => setIsMobileOpen(false)} />
            )}

            <aside className={`
                fixed top-0 left-0 h-full w-72 bg-[#0F172A] border-r border-slate-800 z-[60] text-slate-300
                transform transition-transform duration-300 ease-in-out flex flex-col font-sans
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0
            `}>

                {/* Logo Area - Estilo Original Restaurado */}
                <div className="p-6 flex items-center space-x-3 border-b border-slate-800/50 bg-[#0F172A]">
                    <img
                        src={logoHome}
                        alt="SISMOG Logo"
                        className="w-10 h-10 object-contain"
                    />
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-wide">SISMOG</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                            Gestão Integrada
                        </p>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-0 custom-sidebar-scroll">
                    <div className="px-6 mb-2">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                            Menu Principal
                        </h3>
                    </div>

                    {menuItems.map((item, index) => {
                        const isActive = location.pathname === item.path || (item.submenu && item.submenu.some(sub => location.pathname === sub.path));
                        const isOpen = openSubmenus[item.title];
                        const isDisabled = item.disabled;

                        // ACTIVE STATE: Mantendo a lógica de borda lateral (Faixa) da nova estrutura, mas com medidas ajustadas
                        // Se desejar voltar totalmente para o botão arredondado (Pílula), avise. 
                        // Abaixo mantive o visual "Faixa" mas com as medidas compactas solicitadas.
                        const activeClass = "bg-gradient-to-r from-blue-900/20 to-transparent border-l-4 border-blue-500 text-blue-400";
                        const inactiveClass = "border-l-4 border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/30";

                        if (item.submenu) {
                            return (
                                <div key={index} className="mb-1">
                                    <button
                                        onClick={() => !isDisabled && toggleSubmenu(item.title)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 transition-all duration-200 group 
                                            ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                                            ${isActive || isOpen ? activeClass : inactiveClass} 
                                        `}
                                        disabled={isDisabled}
                                    >
                                        <div className="flex items-center">
                                            <span className={`mr-3 transition-colors ${isActive || isOpen ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'} `}>
                                                {item.icon}
                                            </span>
                                            <span className="text-sm font-medium">{item.title}</span>
                                        </div>
                                        <ChevronLeft size={16} className={`transition-transform duration-200 ${isOpen ? '-rotate-90 text-blue-400' : 'text-slate-600'}`} />
                                    </button>

                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'} `}>
                                        {/* Removido o bg-slate-900/30 para ficar "Simples" conforme solicitado, ou mantemos se preferir contraste */}
                                        <div className="pb-1">
                                            {item.submenu.map((subItem, subIndex) => {
                                                const isSubActive = location.pathname === subItem.path;
                                                return (
                                                    <Link
                                                        key={subIndex}
                                                        to={subItem.path}
                                                        className={`flex items-center pl-6 pr-4 py-2 text-sm transition-all duration-200 border-l-4 border-transparent
                                                            ${subItem.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
                                                            ${isSubActive
                                                                ? 'text-blue-400 font-medium'
                                                                : 'text-slate-500 hover:text-slate-200'
                                                            } `}
                                                    >
                                                        <span className="mr-3 opacity-80">
                                                            {subItem.icon}
                                                        </span>
                                                        <span>{subItem.title}</span>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Link Simples
                        return (
                            <Link
                                key={index}
                                to={item.path}
                                className={`flex items-center px-3 py-2.5 transition-all duration-200 group mb-1
                                    ${isDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
                                    ${isActive ? activeClass : inactiveClass} 
                                `}
                            >
                                <span className={`mr-3 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'} `}>
                                    {item.icon}
                                </span>
                                <span className="text-sm font-medium">{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer User Profile */}
                <div className="p-3 border-t border-slate-800/50 bg-[#0B1120]">
                    <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors group">
                        <div className="flex-1 overflow-hidden mr-2">
                            <h4 className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                                {dbUserName || 'Usuário'}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate" title={user?.email}>
                                {user?.email}
                            </p>
                        </div>
                        <Link to="/configuracoes" className="text-slate-500 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700/50">
                            <Settings size={18} />
                        </Link>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full mt-2 flex items-center justify-center space-x-2 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-slate-800/30"
                    >
                        <LogOut size={14} />
                        <span>Sair da conta</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
