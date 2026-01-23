import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Layers,
    ClipboardList,
    Users,
    UserCheck,
    Banknote,
    Car,
    Settings,
    Menu,
    X,
    ChevronDown,
    ChevronRight,
    LogOut
} from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';

const navigation = [
    { name: 'DASHBOARD', to: '/', icon: LayoutDashboard, exact: true },
    { name: 'CURRÍCULOS', to: '/curriculos', icon: ClipboardList },
    {
        name: 'ESTOQUE',
        icon: Layers,
        children: [
            { name: 'Controle de Estoque', to: '/estoque/controle' },
            { name: 'Equip. Controlados', to: '/estoque/equipamentos' },
        ],
    },
    {
        name: 'DEPARTAMENTO PESSOAL',
        icon: Users,
        children: [
            { name: 'Funcionários', to: '/dp/funcionarios' }, // Mantido no DP
            { name: 'Cargos e Salários', to: '/dp/cargos-salarios' },
            { name: 'Folha de Pagamento', to: '/dp/folha' },
        ],
    },
    {
        name: 'SUPERVISÃO',
        icon: UserCheck,
        children: [
            { name: 'Gestão de Postos', to: '/supervisao/gestao-postos' },
            { name: 'Postos de Trabalho', to: '/supervisao/postos' }, // Movido para Supervisão
            { name: 'Escalas', to: '/supervisao/escalas' },
            { name: 'Serviços Extras', to: '/supervisao/servicos-extras' },
        ],
    },
    {
        name: 'FINANCEIRO',
        icon: Banknote,
        children: [
            { name: 'Contratos', to: '/financeiro/contratos' },
            { name: 'Faturamentos', to: '/financeiro/faturamentos' },
            { name: 'Recebimentos', to: '/financeiro/recebimentos' },
            { name: 'Tributos', to: '/financeiro/tributos' },
        ],
    },
    {
        name: 'CONFIGURAÇÕES',
        icon: Settings,
        children: [
            { name: 'Usuários', to: '/config/usuarios' },
            { name: 'Empresas', to: '/config/empresas' },
            { name: 'Contas Correntes', to: '/config/contas' },
            { name: 'Cartões de Crédito', to: '/config/cartoes' },
        ],
    },
];

export default function MainLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openModules, setOpenModules] = useState({});
    const [user, setUser] = useState({ id: null, nome: 'Usuário', nomeCompleto: '', email: '', telefone: '' });
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [telefone, setTelefone] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const location = useLocation();
    const navigate = useNavigate();

    // Máscara de telefone
    const maskPhone = (value) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .replace(/(-\d{4})\d+?$/, '$1');
    };

    // Buscar dados do usuário autenticado
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                // Buscar dados completos da tabela usuarios
                const { data: usuarioData } = await supabase
                    .from('usuarios')
                    .select('nome_completo, email')
                    .eq('id', authUser.id)
                    .single();

                if (usuarioData) {
                    const primeiroNome = usuarioData.nome_completo?.split(' ')[0] || 'Usuário';
                    setUser({
                        nome: primeiroNome,
                        nomeCompleto: usuarioData.nome_completo || '',
                        email: usuarioData.email || authUser.email
                    });
                } else {
                    // Fallback para metadata do auth
                    const primeiroNome = authUser.user_metadata?.full_name?.split(' ')[0] || 'Usuário';
                    setUser({
                        nome: primeiroNome,
                        nomeCompleto: authUser.user_metadata?.full_name || '',
                        email: authUser.email
                    });
                }
            }
        };
        fetchUser();
    }, []);

    // Abrir modal de configurações
    const handleOpenSettings = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
            const { data } = await supabase
                .from('usuarios')
                .select('telefone')
                .eq('id', authUser.id)
                .single();
            setTelefone(data?.telefone || '');
        }
        setNovaSenha('');
        setConfirmarSenha('');
        setMessage({ type: '', text: '' });
        setShowSettingsModal(true);
    };

    // Salvar configurações
    const handleSaveSettings = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error('Usuário não autenticado');

            // Atualizar telefone
            const { error: updateError } = await supabase
                .from('usuarios')
                .update({ telefone })
                .eq('id', authUser.id);

            if (updateError) throw updateError;

            // Atualizar senha se informada
            if (novaSenha) {
                if (novaSenha.length < 6) {
                    throw new Error('A senha deve ter no mínimo 6 caracteres');
                }
                if (novaSenha !== confirmarSenha) {
                    throw new Error('As senhas não conferem');
                }
                const { error: passwordError } = await supabase.auth.updateUser({ password: novaSenha });
                if (passwordError) throw passwordError;
            }

            setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
            setTimeout(() => setShowSettingsModal(false), 1500);
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    // Logout
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const toggleModule = (moduleName) => {
        setOpenModules((prev) => ({
            ...prev,
            [moduleName]: !prev[moduleName],
        }));
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">

            {/* Mobile Drawer Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm lg:hidden transition-opacity"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={clsx(
                    "bg-slate-900 text-slate-400 w-64 flex flex-col transition-all duration-300",
                    "fixed inset-y-0 left-0 z-50 lg:static lg:flex",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo Area */}
                <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-800">
                    <img src="/logo.png" alt="SISMOG Logo" className="h-10 w-auto" />
                    <div className="flex flex-col gap-0.5">
                        <span className="text-base font-bold tracking-wide text-white leading-tight">SISMOG</span>
                        <span className="text-[10px] font-medium uppercase text-slate-500">Gestão Integrada</span>
                    </div>
                    {/* Close button for mobile */}
                    <button
                        type="button"
                        className="ml-auto lg:hidden text-slate-400 hover:text-white"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 pt-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

                    {/* MENU Label */}
                    <div className="mb-6 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                        MENU
                    </div>

                    <div className="space-y-1">
                        {navigation.map((item) => {
                            if (!item.children) {
                                return (
                                    <NavLink
                                        key={item.name}
                                        to={item.to}
                                        className={({ isActive }) =>
                                            clsx(
                                                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all', // Adjusted font size to text-xs
                                                isActive
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                            )
                                        }
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.name}
                                    </NavLink>
                                );
                            }

                            // Accordion Logic for Modules
                            const isOpen = openModules[item.name];

                            return (
                                <div key={item.name} className="space-y-1">
                                    <button
                                        onClick={() => toggleModule(item.name)}
                                        className={clsx(
                                            'w-full group flex items-center justify-between gap-3 rounded-lg px-3 py-3 text-xs font-medium transition-all', // Adjusted font size to text-xs
                                            isOpen
                                                ? 'bg-white/5 text-white'
                                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="h-5 w-5" />
                                            {item.name}
                                        </div>
                                        {isOpen ? (
                                            <ChevronDown className="h-4 w-4 text-slate-500" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4 text-slate-500" />
                                        )}
                                    </button>

                                    {/* Sub Items with Tree View Style */}
                                    {isOpen && (
                                        <div className="space-y-1 border-l border-slate-700 ml-6 pl-2">
                                            {item.children.map((subItem) => (
                                                <NavLink
                                                    key={subItem.name}
                                                    to={subItem.to}
                                                    className={({ isActive }) =>
                                                        clsx(
                                                            'flex items-center gap-3 rounded-lg py-2 px-3 text-xs font-medium transition-all', // Font size is already text-xs but ensuring consistency
                                                            isActive
                                                                ? 'text-blue-400'
                                                                : 'text-slate-500 hover:text-slate-300'
                                                        )
                                                    }
                                                    onClick={() => setMobileMenuOpen(false)}
                                                >
                                                    {subItem.name}
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </nav>

                {/* User Profile */}
                <div className="border-t border-slate-800 p-4 mt-auto">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                            {user.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col overflow-hidden flex-1">
                            <span className="text-sm font-medium text-white truncate">{user.nome}</span>
                            <span className="text-xs text-slate-500 truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleOpenSettings}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                title="Configurações"
                            >
                                <Settings className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                                title="Sair"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Mobile Header */}
                {/* Mobile Header */}
                <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between lg:hidden shrink-0">
                    <button
                        type="button"
                        className="-ml-2 p-2 text-slate-400 hover:text-white"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </button>

                    <div className="flex items-center gap-2">
                        <img src="/logo.png" alt="SISMOG" className="h-6 w-auto" />
                        <span className="text-sm font-bold tracking-wide text-white">SISMOG</span>
                    </div>
                </header>

                {/* Outlet Container */}
                <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
                    <Outlet />
                </main>
            </div>

            {/* Modal de Configurações */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowSettingsModal(false)} />

                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Settings className="h-5 w-5 text-blue-600" />
                                Configurações da Conta
                            </h3>
                            <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Identificação do Usuário */}
                        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                    {user.nome.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900">{user.nomeCompleto || user.nome}</p>
                                    <p className="text-sm text-slate-500">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Mensagem de feedback */}
                            {message.text && (
                                <div className={`p-3 rounded-lg text-sm ${message.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                    }`}>
                                    {message.text}
                                </div>
                            )}

                            {/* Telefone */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Telefone</label>
                                <input
                                    type="text"
                                    value={telefone}
                                    onChange={(e) => setTelefone(maskPhone(e.target.value))}
                                    placeholder="(00) 00000-0000"
                                    maxLength={15}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                />
                            </div>

                            {/* Divisor */}
                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-3 bg-white text-xs text-slate-400 uppercase">Alterar Senha</span>
                                </div>
                            </div>

                            {/* Nova Senha */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Nova Senha</label>
                                <input
                                    type="password"
                                    value={novaSenha}
                                    onChange={(e) => setNovaSenha(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                />
                            </div>

                            {/* Confirmar Senha */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Confirmar Nova Senha</label>
                                <input
                                    type="password"
                                    value={confirmarSenha}
                                    onChange={(e) => setConfirmarSenha(e.target.value)}
                                    placeholder="Repita a senha"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowSettingsModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving && <span className="animate-spin">⏳</span>}
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
