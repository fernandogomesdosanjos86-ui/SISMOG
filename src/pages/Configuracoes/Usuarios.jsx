import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import clsx from 'clsx';
import { Search, ChevronDown, ChevronRight, User, Users } from 'lucide-react';

// --- SERVIÇOS E CONFIG ---
import { usuariosService } from '../../services/usuariosService';
import { getModulosParaPermissoes, NIVEIS_PERMISSAO } from '../../config/modulos';

// --- INFRAESTRUTURA COMPARTILHADA ---
import { useToast } from '../../components/ui/Toast';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import StatusBadge from '../../components/ui/StatusBadge';
import TableActionButtons from '../../components/ui/TableActionButtons';
import TableFilters from '../../components/ui/TableFilters';

// --- CONSTANTES ---
const STATUS_TABS = [
    { key: 'aguardando_aprovacao', label: 'Aguardando' },
    { key: 'ativo', label: 'Ativos' },
    { key: 'inativo', label: 'Inativos' }
];

const TIPOS_USUARIO = [
    { value: 'administrador', label: 'Administrador' },
    { value: 'gestao', label: 'Gestão' },
    { value: 'operador', label: 'Operador' }
];

const STATUS_OPTIONS = [
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' },
    { value: 'aguardando_aprovacao', label: 'Aguardando Aprovação' }
];

// --- SCHEMA ---
const usuarioSchema = z.object({
    tipo: z.string().min(1, 'Tipo é obrigatório'),
    status: z.string().min(1, 'Status é obrigatório')
});

// --- HELPERS ---
const formatCPF = (cpf) => {
    if (!cpf) return '-';
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return cpf;
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const formatPhone = (phone) => {
    if (!phone) return '-';
    const clean = phone.replace(/\D/g, '');
    if (clean.length === 11) {
        return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (clean.length === 10) {
        return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
};

const getTipoLabel = (tipo) => {
    const found = TIPOS_USUARIO.find(t => t.value === tipo);
    return found ? found.label : tipo || '-';
};

export default function Usuarios() {
    // --- ESTADOS ---
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('ativo');
    const [statusCounts, setStatusCounts] = useState({ aguardando_aprovacao: 0, ativo: 0, inativo: 0 });

    // Modais
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('view');
    const [selectedUsuario, setSelectedUsuario] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Confirmação delete
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Permissões
    const [permissoes, setPermissoes] = useState({});
    const [expandedModulos, setExpandedModulos] = useState([]);

    const { addToast } = useToast();

    // --- FORMULÁRIO ---
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        resolver: zodResolver(usuarioSchema),
        defaultValues: {
            tipo: 'operador',
            status: 'aguardando_aprovacao'
        }
    });

    const tipoAtual = watch('tipo');

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const [data, counts] = await Promise.all([
                usuariosService.getAll(activeTab),
                usuariosService.countByStatus()
            ]);
            setUsuarios(data || []);
            setStatusCounts(counts);
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: 'Falha ao carregar usuários.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    // --- PERMISSÕES HELPERS ---
    const initializePermissoes = async (usuarioId) => {
        const modulos = getModulosParaPermissoes();
        const savedPermissoes = await usuariosService.getPermissoes(usuarioId);

        const permissoesMap = {};

        // Inicializar todos como 'sem_acesso'
        modulos.forEach(m => {
            if (m.submodulos) {
                m.submodulos.forEach(s => {
                    permissoesMap[`${m.modulo}.${s.key}`] = 'sem_acesso';
                });
            } else {
                permissoesMap[m.modulo] = 'sem_acesso';
            }
        });

        // Preencher com valores salvos
        savedPermissoes.forEach(p => {
            const key = p.submodulo ? `${p.modulo}.${p.submodulo}` : p.modulo;
            permissoesMap[key] = p.nivel;
        });

        setPermissoes(permissoesMap);
    };

    const toggleModulo = (modulo) => {
        setExpandedModulos(prev =>
            prev.includes(modulo)
                ? prev.filter(m => m !== modulo)
                : [...prev, modulo]
        );
    };

    const handlePermissaoChange = (key, nivel) => {
        setPermissoes(prev => ({ ...prev, [key]: nivel }));
    };

    // --- HANDLERS ---
    const handleOpenView = async (usuario) => {
        setModalMode('view');
        setSelectedUsuario(usuario);
        setValue('tipo', usuario.tipo || 'operador');
        setValue('status', usuario.status || 'aguardando_aprovacao');

        if (usuario.tipo === 'gestao') {
            await initializePermissoes(usuario.id);
        }

        setShowModal(true);
    };

    const handleSwitchToEdit = () => {
        setModalMode('edit');
    };

    const onSubmit = async (data) => {
        try {
            setActionLoading(true);

            // Atualizar usuário
            await usuariosService.update(selectedUsuario.id, {
                tipo: data.tipo,
                status: data.status
            });

            // Se for gestão, salvar permissões
            if (data.tipo === 'gestao') {
                const permissoesArray = Object.entries(permissoes).map(([key, nivel]) => {
                    const parts = key.split('.');
                    return {
                        modulo: parts[0],
                        submodulo: parts.length > 1 ? parts[1] : null,
                        nivel
                    };
                });
                await usuariosService.savePermissoes(selectedUsuario.id, permissoesArray);
            } else {
                // Se não for gestão, limpar permissões
                await usuariosService.savePermissoes(selectedUsuario.id, []);
            }

            addToast({ type: 'success', title: 'Sucesso', message: 'Usuário atualizado.' });
            fetchData();
            setShowModal(false);
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            addToast({ type: 'error', title: 'Erro', message: error?.message || 'Erro ao salvar dados.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await usuariosService.delete(itemToDelete.id);
            addToast({ type: 'success', title: 'Excluído', message: 'Usuário removido.' });
            fetchData();
        } catch (error) {
            addToast({ type: 'error', title: 'Erro', message: 'Não foi possível excluir.' });
        } finally {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    // --- FILTROS ---
    const filteredUsuarios = usuarios.filter(u =>
    (u.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.cpf?.includes(searchTerm) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const isViewMode = modalMode === 'view';
    const modulos = getModulosParaPermissoes();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
                    <p className="text-slate-500">Gerencie os usuários e permissões do sistema</p>
                </div>
            </div>

            {/* Busca */}
            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, CPF ou email..."
            />

            {/* Abas de Status */}
            <div className="flex gap-2 border-b border-slate-200">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={clsx(
                            "px-4 py-2 text-sm font-medium transition-colors relative",
                            activeTab === tab.key
                                ? "text-blue-600 border-b-2 border-blue-600"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        {tab.label}
                        {statusCounts[tab.key] > 0 && (
                            <span className={clsx(
                                "ml-2 px-2 py-0.5 text-xs rounded-full",
                                activeTab === tab.key
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-slate-100 text-slate-500"
                            )}>
                                {statusCounts[tab.key]}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tabela Desktop */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hidden md:block">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Nome</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">CPF</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Tipo</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {loading ? (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-500">Carregando...</td></tr>
                        ) : filteredUsuarios.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-slate-500">Nenhum usuário encontrado.</td></tr>
                        ) : (
                            filteredUsuarios.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => handleOpenView(item)}
                                    className="hover:bg-slate-50 transition-colors cursor-pointer border-l-4 border-blue-500"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                                                <User className="h-4 w-4 text-slate-500" />
                                            </div>
                                            <span className="font-bold text-slate-900">{item.nome_completo || item.nome || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                                        {formatCPF(item.cpf)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {item.email || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={clsx(
                                            "px-2 py-1 text-xs font-medium rounded-full",
                                            item.tipo === 'administrador' && "bg-purple-100 text-purple-700",
                                            item.tipo === 'gestao' && "bg-blue-100 text-blue-700",
                                            item.tipo === 'operador' && "bg-slate-100 text-slate-700"
                                        )}>
                                            {getTipoLabel(item.tipo)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <TableActionButtons
                                            onView={() => handleOpenView(item)}
                                            onEdit={() => { handleOpenView(item).then(() => setModalMode('edit')); }}
                                            onDelete={() => { setItemToDelete(item); setShowDeleteModal(true); }}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cards Mobile */}
            <div className="md:hidden space-y-4">
                {filteredUsuarios.map(item => (
                    <div
                        key={item.id}
                        onClick={() => handleOpenView(item)}
                        className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 space-y-3 cursor-pointer"
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                                    <User className="h-5 w-5 text-slate-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{item.nome_completo || item.nome || '-'}</h3>
                                    <p className="text-sm text-slate-500">{item.email || '-'}</p>
                                </div>
                            </div>
                            <span className={clsx(
                                "px-2 py-1 text-xs font-medium rounded-full",
                                item.tipo === 'administrador' && "bg-purple-100 text-purple-700",
                                item.tipo === 'gestao' && "bg-blue-100 text-blue-700",
                                item.tipo === 'operador' && "bg-slate-100 text-slate-700"
                            )}>
                                {getTipoLabel(item.tipo)}
                            </span>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <TableActionButtons
                                onEdit={() => { handleOpenView(item).then(() => setModalMode('edit')); }}
                                onDelete={() => { setItemToDelete(item); setShowDeleteModal(true); }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />

                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">
                                {modalMode === 'view' ? 'Detalhes do Usuário' : 'Editar Usuário'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="sr-only">Fechar</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-6">
                            {/* Seção 1: Dados do Usuário */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Dados do Usuário</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                                        <input
                                            type="text"
                                            value={selectedUsuario?.nome_completo || selectedUsuario?.nome || ''}
                                            disabled
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">CPF</label>
                                        <input
                                            type="text"
                                            value={formatCPF(selectedUsuario?.cpf)}
                                            disabled
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-500 font-mono"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Telefone</label>
                                        <input
                                            type="text"
                                            value={formatPhone(selectedUsuario?.telefone)}
                                            disabled
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Email</label>
                                        <input
                                            type="text"
                                            value={selectedUsuario?.email || ''}
                                            disabled
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Tipo</label>
                                        <select
                                            disabled={isViewMode}
                                            {...register('tipo')}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                                        >
                                            {TIPOS_USUARIO.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                        {errors.tipo && <span className="text-xs text-red-600">{errors.tipo.message}</span>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Status</label>
                                        <select
                                            disabled={isViewMode}
                                            {...register('status')}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                                        >
                                            {STATUS_OPTIONS.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                        {errors.status && <span className="text-xs text-red-600">{errors.status.message}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Seção 2: Permissões (só aparece se tipo = 'gestao') */}
                            {tipoAtual === 'gestao' && (
                                <div className="space-y-4 pt-4 border-t border-slate-200">
                                    <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Permissões de Acesso
                                    </h4>

                                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                        {modulos.map(m => (
                                            <div key={m.modulo} className="border border-slate-200 rounded-lg overflow-hidden">
                                                {/* Header do módulo */}
                                                <div
                                                    className={clsx(
                                                        "flex items-center justify-between px-4 py-3 bg-slate-50",
                                                        m.submodulos && "cursor-pointer hover:bg-slate-100"
                                                    )}
                                                    onClick={() => m.submodulos && toggleModulo(m.modulo)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {m.submodulos && (
                                                            expandedModulos.includes(m.modulo)
                                                                ? <ChevronDown className="h-4 w-4 text-slate-500" />
                                                                : <ChevronRight className="h-4 w-4 text-slate-500" />
                                                        )}
                                                        <span className="font-medium text-slate-700">{m.label}</span>
                                                    </div>

                                                    {/* Select para módulos sem submódulos */}
                                                    {!m.submodulos && (
                                                        <select
                                                            disabled={isViewMode}
                                                            value={permissoes[m.modulo] || 'sem_acesso'}
                                                            onChange={(e) => handlePermissaoChange(m.modulo, e.target.value)}
                                                            className="px-2 py-1 text-sm rounded border border-slate-300 disabled:bg-slate-100 disabled:text-slate-500"
                                                        >
                                                            {NIVEIS_PERMISSAO.map(n => (
                                                                <option key={n.value} value={n.value}>{n.label}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>

                                                {/* Submódulos expandidos */}
                                                {m.submodulos && expandedModulos.includes(m.modulo) && (
                                                    <div className="border-t border-slate-200 bg-white">
                                                        {m.submodulos.map((s, idx) => (
                                                            <div
                                                                key={s.key}
                                                                className={clsx(
                                                                    "flex items-center justify-between px-4 py-2 pl-10",
                                                                    idx < m.submodulos.length - 1 && "border-b border-slate-100"
                                                                )}
                                                            >
                                                                <span className="text-sm text-slate-600">
                                                                    {idx === m.submodulos.length - 1 ? '└' : '├'} {s.label}
                                                                </span>
                                                                <select
                                                                    disabled={isViewMode}
                                                                    value={permissoes[`${m.modulo}.${s.key}`] || 'sem_acesso'}
                                                                    onChange={(e) => handlePermissaoChange(`${m.modulo}.${s.key}`, e.target.value)}
                                                                    className="px-2 py-1 text-sm rounded border border-slate-300 disabled:bg-slate-100 disabled:text-slate-500"
                                                                >
                                                                    {NIVEIS_PERMISSAO.map(n => (
                                                                        <option key={n.value} value={n.value}>{n.label}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </form>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                {isViewMode ? 'Fechar' : 'Cancelar'}
                            </button>

                            {isViewMode ? (
                                <button
                                    type="button"
                                    onClick={handleSwitchToEdit}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                >
                                    Editar
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                >
                                    {actionLoading && <span className="animate-spin">⏳</span>}
                                    Salvar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={showDeleteModal}
                title="Excluir Usuário"
                message="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
            />
        </div>
    );
}
