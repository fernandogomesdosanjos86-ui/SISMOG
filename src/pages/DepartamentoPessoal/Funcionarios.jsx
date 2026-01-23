import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Users, Building2, User, Shirt, CreditCard, Search } from 'lucide-react';
import clsx from 'clsx';

// --- SERVIÇOS & UTILS ---
import { useToast } from '../../components/ui/Toast';
import { funcionariosService } from '../../services/funcionariosService';
import { empresasService } from '../../services/empresasService';
import { cargosSalariosService } from '../../services/cargosSalariosService';
import { getBorderColor } from '../../utils/styles';
import { validateCPF } from '../../utils/validators';

// --- COMPONENTES UI ---
import CompanyTabs from '../../components/ui/CompanyTabs';
import CompanyBadge from '../../components/ui/CompanyBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import TableActionButtons from '../../components/ui/TableActionButtons';
import TableFilters from '../../components/ui/TableFilters';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import InputMask from '../../components/ui/InputMask';

// --- CONSTANTES ---
const TIPOS_CONTRATO = [
    'Mensalista',
    'Intermitente',
    'Prazo Determinado',
    'Prolabore',
    'Estagiário',
    'Outro'
];

const TAMANHOS_CAMISA = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XXG'];
const TAMANHOS_CALCA = ['36', '38', '40', '42', '44', '46', '48', '50', '52', '54'];

// --- SCHEMA ---
const funcionarioSchema = z.object({
    empresa_id: z.string().min(1, 'Empresa obrigatória'),
    matricula: z.string().optional(),
    nome: z.string().min(3, 'Nome obrigatório'),
    tipo_contrato: z.string().min(1, 'Tipo de contrato obrigatório'),
    cargo_id: z.string().optional(),
    ativo: z.boolean().default(true),
    camisa: z.string().optional(),
    calca: z.string().optional(),
    calcado: z.string().optional(),
    data_nascimento: z.string().optional(),
    rg: z.string().optional(),
    cpf: z.string().optional(),
    telefone: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    banco: z.string().optional(),
    agencia: z.string().optional(),
    conta_corrente: z.string().optional(),
    pix: z.string().optional()
});

// --- KPI CARD ---
const MetricCard = ({ title, value, icon: Icon, color = 'blue' }) => {
    const colors = {
        blue: { bg: 'bg-blue-50 border-blue-200', icon: 'bg-blue-100 text-blue-600' },
        emerald: { bg: 'bg-emerald-50 border-emerald-200', icon: 'bg-emerald-100 text-emerald-600' },
        amber: { bg: 'bg-amber-50 border-amber-200', icon: 'bg-amber-100 text-amber-600' },
        purple: { bg: 'bg-purple-50 border-purple-200', icon: 'bg-purple-100 text-purple-600' }
    };
    const c = colors[color] || colors.blue;

    return (
        <div className={`p-4 rounded-xl border shadow-sm flex items-center gap-4 ${c.bg}`}>
            <div className={`p-3 rounded-lg ${c.icon}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
};

export default function Funcionarios() {
    const { addToast } = useToast();

    // Data
    const [funcionarios, setFuncionarios] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [stats, setStats] = useState({ total: 0, porEmpresa: {} });
    const [loading, setLoading] = useState(true);

    // Filters
    const [activeCompany, setActiveCompany] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [editingFunc, setEditingFunc] = useState(null);

    // Delete
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Form
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(funcionarioSchema),
        defaultValues: { ativo: true }
    });

    // --- FETCH ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const [funcsData, empsData, cargosData] = await Promise.all([
                funcionariosService.getAll(activeCompany === 'all' ? null : activeCompany),
                empresasService.getAll(),
                cargosSalariosService.getAll()
            ]);
            setFuncionarios(funcsData || []);
            setEmpresas(empsData || []);
            setCargos(cargosData || []);

            const statsData = await funcionariosService.getStats(empsData || []);
            setStats(statsData);
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao carregar dados.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [activeCompany]);

    // --- HANDLERS ---
    const handleAddNew = () => {
        setEditingFunc(null);
        setIsViewMode(false);
        reset({
            empresa_id: activeCompany !== 'all' ? activeCompany : '',
            ativo: true
        });
        setIsModalOpen(true);
    };

    const handleEdit = (func) => {
        setEditingFunc(func);
        setIsViewMode(false);
        reset({
            ...func,
            empresa_id: func.empresa_id || '',
            cargo_id: func.cargo_id || '',
            data_nascimento: func.data_nascimento?.split('T')[0] || '',
            matricula: func.matricula || '',
            camisa: func.camisa || '',
            calca: func.calca || '',
            calcado: func.calcado || '',
            rg: func.rg || '',
            cpf: func.cpf || '',
            telefone: func.telefone || '',
            email: func.email || '',
            banco: func.banco || '',
            agencia: func.agencia || '',
            conta_corrente: func.conta_corrente || '',
            pix: func.pix || ''
        });
        setIsModalOpen(true);
    };

    const handleView = (func) => {
        handleEdit(func);
        setIsViewMode(true);
    };

    const handleDeleteClick = (func) => {
        setItemToDelete(func);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await funcionariosService.delete(itemToDelete.id);
            addToast({ type: 'success', title: 'Sucesso', message: 'Funcionário excluído.' });
            fetchData();
        } catch (error) {
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao excluir.' });
        } finally {
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const onSubmit = async (data) => {
        try {
            if (editingFunc) {
                await funcionariosService.update(editingFunc.id, data);
                addToast({ type: 'success', title: 'Sucesso', message: 'Funcionário atualizado.' });
            } else {
                await funcionariosService.create(data);
                addToast({ type: 'success', title: 'Sucesso', message: 'Funcionário cadastrado.' });
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: error.message || 'Erro ao salvar.' });
        }
    };

    // --- FILTERS ---
    const filteredFuncionarios = funcionarios
        .filter(f => statusFilter === 'all' || (statusFilter === 'ativo' ? f.ativo : !f.ativo))
        .filter(f =>
            f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (f.matricula || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (f.cpf || '').includes(searchTerm)
        );

    // --- HELPERS ---
    const getCargoLabel = (cargoId) => {
        const cargo = cargos.find(c => c.id === cargoId);
        return cargo ? `${cargo.cargo} ${cargo.uf}` : '-';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Funcionários</h1>
                    <p className="text-slate-500">Gestão de colaboradores</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer active:scale-95 w-full md:w-auto justify-center"
                >
                    <Plus size={20} />
                    Novo Funcionário
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard title="Total Ativos" value={stats.total} icon={Users} color="blue" />
                {empresas.slice(0, 3).map((emp, idx) => (
                    <MetricCard
                        key={emp.id}
                        title={emp.nome_empresa}
                        value={stats.porEmpresa[emp.id] || 0}
                        icon={Building2}
                        color={['emerald', 'amber', 'purple'][idx] || 'blue'}
                    />
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome, matrícula ou CPF..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Status:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option value="all">Todos</option>
                        <option value="ativo">Ativos</option>
                        <option value="inativo">Inativos</option>
                    </select>
                </div>
            </div>

            <CompanyTabs activeTab={activeCompany} onTabChange={setActiveCompany} empresas={empresas} />

            {/* Table Container */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium">
                            <tr>
                                <th className="px-6 py-3 uppercase text-xs font-semibold">Nome</th>
                                <th className="px-6 py-3 uppercase text-xs font-semibold">Empresa</th>
                                <th className="px-6 py-3 uppercase text-xs font-semibold">Matrícula</th>
                                <th className="px-6 py-3 uppercase text-xs font-semibold">Cargo</th>
                                <th className="px-6 py-3 uppercase text-xs font-semibold">Contrato</th>
                                <th className="px-6 py-3 uppercase text-xs font-semibold text-center">Status</th>
                                <th className="px-6 py-3 uppercase text-xs font-semibold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500">Carregando...</td></tr>
                            ) : filteredFuncionarios.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500">Nenhum funcionário encontrado</td></tr>
                            ) : (
                                filteredFuncionarios.map(func => (
                                    <tr
                                        key={func.id}
                                        onClick={() => handleView(func)}
                                        className={clsx(
                                            "hover:bg-slate-50 transition-colors cursor-pointer border-l-4",
                                            getBorderColor(func.empresas?.nome_empresa)
                                        )}
                                    >
                                        <td className="px-6 py-4 font-medium text-slate-900">{func.nome}</td>
                                        <td className="px-6 py-4">
                                            <CompanyBadge nomeEmpresa={func.empresas?.nome_empresa} />
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{func.matricula || '-'}</td>
                                        <td className="px-6 py-4 text-slate-600">{getCargoLabel(func.cargo_id)}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                                {func.tipo_contrato}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge value={func.ativo} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <TableActionButtons
                                                onView={() => handleView(func)}
                                                onEdit={() => handleEdit(func)}
                                                onDelete={() => handleDeleteClick(func)}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4 p-4">
                    {loading ? (
                        <p className="text-center text-slate-500 py-4">Carregando...</p>
                    ) : filteredFuncionarios.length === 0 ? (
                        <p className="text-center text-slate-500 py-4">Nenhum funcionário encontrado</p>
                    ) : (
                        filteredFuncionarios.map(func => (
                            <div
                                key={func.id}
                                onClick={() => handleView(func)}
                                className={clsx(
                                    "bg-white p-4 rounded-lg shadow-sm border-l-4 space-y-3 cursor-pointer",
                                    getBorderColor(func.empresas?.nome_empresa)
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-900">{func.nome}</h3>
                                        <p className="text-xs text-slate-500">{func.matricula || 'Sem matrícula'}</p>
                                    </div>
                                    <StatusBadge value={func.ativo} />
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    <CompanyBadge nomeEmpresa={func.empresas?.nome_empresa} />
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                        {func.tipo_contrato}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                    <span className="text-sm text-slate-600">{getCargoLabel(func.cargo_id)}</span>
                                    <TableActionButtons
                                        onView={() => handleView(func)}
                                        onEdit={() => handleEdit(func)}
                                        onDelete={() => handleDeleteClick(func)}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal CRUD */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-lg font-bold text-slate-900">
                                {isViewMode ? 'Detalhes do Funcionário' : editingFunc ? 'Editar Funcionário' : 'Novo Funcionário'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8 overflow-y-auto">
                            {/* Seção: Informações Funcionais */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1 flex items-center gap-2">
                                    <User size={14} /> Informações Funcionais
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Empresa *</label>
                                        <select
                                            {...register('empresa_id')}
                                            disabled={isViewMode}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 bg-white"
                                        >
                                            <option value="">Selecione...</option>
                                            {empresas.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.nome_empresa}</option>
                                            ))}
                                        </select>
                                        {errors.empresa_id && <span className="text-xs text-red-500">{errors.empresa_id.message}</span>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Matrícula</label>
                                        <input
                                            type="text"
                                            {...register('matricula')}
                                            disabled={isViewMode}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Nome *</label>
                                        <input
                                            type="text"
                                            {...register('nome')}
                                            disabled={isViewMode}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                        />
                                        {errors.nome && <span className="text-xs text-red-500">{errors.nome.message}</span>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Tipo de Contrato *</label>
                                        <select
                                            {...register('tipo_contrato')}
                                            disabled={isViewMode}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 bg-white"
                                        >
                                            <option value="">Selecione...</option>
                                            {TIPOS_CONTRATO.map(tipo => (
                                                <option key={tipo} value={tipo}>{tipo}</option>
                                            ))}
                                        </select>
                                        {errors.tipo_contrato && <span className="text-xs text-red-500">{errors.tipo_contrato.message}</span>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Cargo</label>
                                        <select
                                            {...register('cargo_id')}
                                            disabled={isViewMode}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 bg-white"
                                        >
                                            <option value="">Selecione...</option>
                                            {cargos.map(c => (
                                                <option key={c.id} value={c.id}>{c.cargo} {c.uf}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5 flex items-end">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" {...register('ativo')} disabled={isViewMode} className="rounded text-blue-600 focus:ring-blue-500" />
                                            <span className="text-sm font-medium text-slate-700">Ativo</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Seção: Uniforme */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1 flex items-center gap-2">
                                    <Shirt size={14} /> Informações de Uniforme
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Camisa</label>
                                        <select
                                            {...register('camisa')}
                                            disabled={isViewMode}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 bg-white"
                                        >
                                            <option value="">Selecione...</option>
                                            {TAMANHOS_CAMISA.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Calça</label>
                                        <select
                                            {...register('calca')}
                                            disabled={isViewMode}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 bg-white"
                                        >
                                            <option value="">Selecione...</option>
                                            {TAMANHOS_CALCA.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Calçado</label>
                                        <input
                                            type="text"
                                            {...register('calcado')}
                                            disabled={isViewMode}
                                            placeholder="Ex: 42"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Seção: Pessoais */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1 flex items-center gap-2">
                                    <User size={14} /> Informações Pessoais
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Data de Nascimento</label>
                                        <input
                                            type="date"
                                            {...register('data_nascimento')}
                                            disabled={isViewMode}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">RG</label>
                                        <input
                                            type="text"
                                            {...register('rg')}
                                            disabled={isViewMode}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">CPF</label>
                                        <Controller
                                            name="cpf"
                                            control={control}
                                            render={({ field }) => (
                                                <InputMask
                                                    mask="cpf"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    disabled={isViewMode}
                                                    placeholder="000.000.000-00"
                                                />
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Telefone</label>
                                        <Controller
                                            name="telefone"
                                            control={control}
                                            render={({ field }) => (
                                                <InputMask
                                                    mask="phone"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    disabled={isViewMode}
                                                    placeholder="(00) 00000-0000"
                                                />
                                            )}
                                        />
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-medium text-slate-700">Email</label>
                                        <input
                                            type="email"
                                            {...register('email')}
                                            disabled={isViewMode}
                                            placeholder="email@exemplo.com"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                        />
                                        {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Seção: Bancárias */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1 flex items-center gap-2">
                                    <CreditCard size={14} /> Informações Bancárias
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Banco</label>
                                        <input
                                            type="text"
                                            {...register('banco')}
                                            disabled={isViewMode}
                                            placeholder="Ex: Bradesco"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Agência</label>
                                        <input
                                            type="text"
                                            {...register('agencia')}
                                            disabled={isViewMode}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Conta Corrente</label>
                                        <input
                                            type="text"
                                            {...register('conta_corrente')}
                                            disabled={isViewMode}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Pix</label>
                                        <input
                                            type="text"
                                            {...register('pix')}
                                            disabled={isViewMode}
                                            placeholder="CPF, Email, Telefone ou Chave"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                {isViewMode ? 'Fechar' : 'Cancelar'}
                            </button>

                            {isViewMode ? (
                                <button
                                    onClick={() => setIsViewMode(false)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Editar
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting && <span className="animate-spin text-xs">⏳</span>}
                                    {isSubmitting ? 'Salvando...' : 'Salvar Dados'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onCancel={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Excluir Funcionário"
                message={`Tem certeza que deseja excluir "${itemToDelete?.nome}"?`}
            />
        </div>
    );
}
