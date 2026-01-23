import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, FileText, Phone, Mail, MapPin, User, Calendar, Download, X, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

// --- SERVIÇOS & UTILS ---
import { useToast } from '../../components/ui/Toast';
import { curriculosService } from '../../services/curriculosService';
import { curriculosCargosService } from '../../services/curriculosCargosService';
import InputMask from '../../components/ui/InputMask';
import TableActionButtons from '../../components/ui/TableActionButtons';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

// --- SCHEMA ---
const curriculoSchema = z.object({
    nome_completo: z.string().min(3, 'Nome obrigatório'),
    cargo_id: z.string().min(1, 'Cargo obrigatório'),
    telefone: z.string().min(10, 'Telefone obrigatório'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    endereco: z.string().optional(),
    indicacao: z.string().optional(),
    observacoes: z.string().optional(),
    status: z.enum(['Pendente', 'Aprovado', 'Reprovado', 'Contratado']),
    data_inclusao: z.string().min(1, 'Data obrigatória')
});

const cargoSchema = z.object({
    nome: z.string().min(2, 'Nome do cargo obrigatório')
});

// --- STATUS CONFIG ---
const STATUS_CONFIG = {
    Pendente: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    Aprovado: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    Reprovado: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    Contratado: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' }
};

const STATUS_OPTIONS = ['Pendente', 'Aprovado', 'Reprovado', 'Contratado'];

// --- STATUS BADGE CLICÁVEL ---
const StatusBadge = ({ status, onClick }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pendente;
    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer hover:opacity-80",
                config.bg, config.text
            )}
        >
            {status}
        </button>
    );
};

export default function Curriculos() {
    const { addToast } = useToast();
    const today = format(new Date(), 'yyyy-MM-dd');

    // Data
    const [curriculos, setCurriculos] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [cargoFilter, setCargoFilter] = useState('all');
    const [ordenacao, setOrdenacao] = useState('recentes');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [selectedCurriculo, setSelectedCurriculo] = useState(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [cargoModalOpen, setCargoModalOpen] = useState(false);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusModalCurriculo, setStatusModalCurriculo] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // File Upload
    const [arquivoFile, setArquivoFile] = useState(null);
    const fileInputRef = useRef(null);

    // Forms
    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(curriculoSchema),
        defaultValues: { status: 'Pendente', data_inclusao: today }
    });

    const cargoForm = useForm({ resolver: zodResolver(cargoSchema) });

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const [currs, cargsData] = await Promise.all([
                curriculosService.getAll(),
                curriculosCargosService.getAll()
            ]);
            setCurriculos(currs || []);
            setCargos(cargsData || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao carregar currículos.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- FILTROS ---
    const filteredItems = useMemo(() => {
        let items = curriculos.filter(c => {
            const matchSearch = c.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.curriculos_cargos?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCargo = cargoFilter === 'all' || c.cargo_id === cargoFilter;
            const matchStatus = statusFilter === 'all' || c.status === statusFilter;
            return matchSearch && matchCargo && matchStatus;
        });

        // Ordenação
        items.sort((a, b) => {
            if (ordenacao === 'recentes') {
                return new Date(b.data_inclusao) - new Date(a.data_inclusao);
            } else if (ordenacao === 'antigos') {
                return new Date(a.data_inclusao) - new Date(b.data_inclusao);
            }
            return a.nome_completo.localeCompare(b.nome_completo);
        });

        return items;
    }, [curriculos, searchTerm, cargoFilter, statusFilter, ordenacao]);

    // --- HANDLERS ---
    const handleOpenCreate = () => {
        setSelectedCurriculo(null);
        setIsViewMode(false);
        setArquivoFile(null);
        reset({ status: 'Pendente', data_inclusao: today, nome_completo: '', cargo_id: '', telefone: '', email: '', endereco: '', indicacao: '', observacoes: '' });
        setIsModalOpen(true);
    };

    const handleOpenView = (curriculo) => {
        setSelectedCurriculo(curriculo);
        setIsViewMode(true);
        reset({
            nome_completo: curriculo.nome_completo,
            cargo_id: curriculo.cargo_id,
            telefone: curriculo.telefone,
            email: curriculo.email || '',
            endereco: curriculo.endereco || '',
            indicacao: curriculo.indicacao || '',
            observacoes: curriculo.observacoes || '',
            status: curriculo.status,
            data_inclusao: curriculo.data_inclusao
        });
        setArquivoFile(null);
        setIsModalOpen(true);
    };

    const handleSwitchToEdit = () => {
        setIsViewMode(false);
    };

    const handleOpenDelete = (curriculo) => {
        setSelectedCurriculo(curriculo);
        setConfirmModalOpen(true);
    };

    const handleOpenStatusModal = (curriculo) => {
        setStatusModalCurriculo(curriculo);
        setStatusModalOpen(true);
    };

    const handleStatusChange = async (newStatus) => {
        if (!statusModalCurriculo) return;
        try {
            await curriculosService.updateStatus(statusModalCurriculo.id, newStatus);
            addToast({ type: 'success', title: 'Sucesso', message: 'Status atualizado.' });
            setStatusModalOpen(false);
            fetchData();
        } catch (error) {
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao atualizar status.' });
        }
    };

    const onSubmit = async (data) => {
        try {
            setActionLoading(true);

            if (selectedCurriculo) {
                // Update
                await curriculosService.update(selectedCurriculo.id, data);

                // Upload arquivo se houver novo
                if (arquivoFile) {
                    await curriculosService.uploadArquivo(selectedCurriculo.id, arquivoFile);
                }

                addToast({ type: 'success', title: 'Sucesso', message: 'Currículo atualizado.' });
            } else {
                // Create
                const created = await curriculosService.create(data);

                // Upload arquivo se houver
                if (arquivoFile) {
                    await curriculosService.uploadArquivo(created.id, arquivoFile);
                }

                addToast({ type: 'success', title: 'Sucesso', message: 'Currículo cadastrado.' });
            }

            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            addToast({ type: 'error', title: 'Erro', message: error?.message || 'Erro ao salvar currículo.' });
        } finally {
            setActionLoading(false);
        }
    };

    const confirmDelete = async () => {
        try {
            await curriculosService.delete(selectedCurriculo.id);
            addToast({ type: 'success', title: 'Excluído', message: 'Currículo removido.' });
            fetchData();
        } catch (error) {
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao excluir.' });
        } finally {
            setConfirmModalOpen(false);
        }
    };

    const onSubmitCargo = async (data) => {
        try {
            const novoCargo = await curriculosCargosService.create(data.nome);
            addToast({ type: 'success', title: 'Sucesso', message: 'Cargo criado.' });
            setCargos([...cargos, novoCargo]);
            setValue('cargo_id', novoCargo.id);
            setCargoModalOpen(false);
            cargoForm.reset();
        } catch (error) {
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao criar cargo.' });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Currículo</h1>
                    <p className="text-slate-500">Gestão de Candidatos</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <Plus size={20} /> Currículo
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome ou cargo..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Cargo:</label>
                    <select
                        value={cargoFilter}
                        onChange={(e) => setCargoFilter(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option value="all">Todos</option>
                        {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Ordenar:</label>
                    <select
                        value={ordenacao}
                        onChange={(e) => setOrdenacao(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option value="recentes">Mais recentes</option>
                        <option value="antigos">Mais antigos</option>
                    </select>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {['all', ...STATUS_OPTIONS].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setStatusFilter(tab)}
                        className={clsx(
                            "flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                            statusFilter === tab
                                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-transparent'
                        )}
                    >
                        {tab === 'all' ? 'Todos' : tab}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Nome</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Cargo</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Telefone</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Indicação</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Arquivo</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500">Carregando...</td></tr>
                            ) : filteredItems.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500">Nenhum currículo encontrado.</td></tr>
                            ) : filteredItems.map(item => (
                                <tr
                                    key={item.id}
                                    onClick={() => handleOpenView(item)}
                                    className={clsx(
                                        "hover:bg-slate-50 transition-colors cursor-pointer border-l-4",
                                        STATUS_CONFIG[item.status]?.border || 'border-slate-300'
                                    )}
                                >
                                    <td className="px-6 py-4 font-medium text-slate-900">{item.nome_completo}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700">
                                            {item.curriculos_cargos?.nome}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{item.telefone}</td>
                                    <td className="px-6 py-4 text-slate-600">{item.indicacao || '-'}</td>
                                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                        {item.arquivo_url ? (
                                            <a
                                                href={item.arquivo_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                                            >
                                                <Download size={14} />
                                                <span className="truncate max-w-[100px]">{item.arquivo_nome || 'Baixar'}</span>
                                            </a>
                                        ) : <span className="text-slate-400">-</span>}
                                    </td>
                                    <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                                        <StatusBadge
                                            status={item.status}
                                            onClick={() => handleOpenStatusModal(item)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                        <TableActionButtons
                                            onView={() => handleOpenView(item)}
                                            onEdit={() => { handleOpenView(item); setTimeout(() => setIsViewMode(false), 100); }}
                                            onDelete={() => handleOpenDelete(item)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4 p-4">
                    {loading ? <p className="text-center text-slate-500">Carregando...</p> : filteredItems.length === 0 ? <p className="text-center text-slate-500">Nenhum currículo</p> : (
                        filteredItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => handleOpenView(item)}
                                className={clsx(
                                    "bg-white p-4 rounded-lg shadow-sm border-l-4 cursor-pointer space-y-3",
                                    STATUS_CONFIG[item.status]?.border || 'border-slate-300'
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-900">{item.nome_completo}</h3>
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                                            {item.curriculos_cargos?.nome}
                                        </span>
                                    </div>
                                    <div onClick={e => e.stopPropagation()}>
                                        <StatusBadge
                                            status={item.status}
                                            onClick={() => handleOpenStatusModal(item)}
                                        />
                                    </div>
                                </div>
                                <div className="text-sm text-slate-600 space-y-1">
                                    <p className="flex items-center gap-2"><Phone size={14} /> {item.telefone}</p>
                                    {item.indicacao && <p className="flex items-center gap-2"><User size={14} /> {item.indicacao}</p>}
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                    {item.arquivo_url ? (
                                        <a
                                            href={item.arquivo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                                        >
                                            <FileText size={14} />
                                            <span className="truncate max-w-[120px]">{item.arquivo_nome}</span>
                                        </a>
                                    ) : <span className="text-slate-400 text-sm">Sem arquivo</span>}
                                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                        <TableActionButtons
                                            onView={() => handleOpenView(item)}
                                            onEdit={() => { handleOpenView(item); setTimeout(() => setIsViewMode(false), 100); }}
                                            onDelete={() => handleOpenDelete(item)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal Criar/Editar/Visualizar */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">
                                {isViewMode ? 'Detalhes do Currículo' : selectedCurriculo ? 'Editar Currículo' : 'Novo Currículo'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-4">
                            {/* Nome */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Nome Completo *</label>
                                <input
                                    type="text"
                                    {...register('nome_completo')}
                                    disabled={isViewMode}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                />
                                {errors.nome_completo && <span className="text-xs text-red-500">{errors.nome_completo.message}</span>}
                            </div>

                            {/* Cargo */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-700">Cargo *</label>
                                    {!isViewMode && (
                                        <button
                                            type="button"
                                            onClick={() => setCargoModalOpen(true)}
                                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            <Plus size={14} /> Novo
                                        </button>
                                    )}
                                </div>
                                <select
                                    {...register('cargo_id')}
                                    disabled={isViewMode}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                >
                                    <option value="">Selecione...</option>
                                    {cargos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                </select>
                                {errors.cargo_id && <span className="text-xs text-red-500">{errors.cargo_id.message}</span>}
                            </div>

                            {/* Telefone e Email */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Telefone *</label>
                                    <InputMask
                                        mask="telefone"
                                        {...register('telefone')}
                                        disabled={isViewMode}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                    />
                                    {errors.telefone && <span className="text-xs text-red-500">{errors.telefone.message}</span>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Email</label>
                                    <input
                                        type="email"
                                        {...register('email')}
                                        disabled={isViewMode}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                    />
                                    {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                                </div>
                            </div>

                            {/* Endereço */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Endereço</label>
                                <input
                                    type="text"
                                    {...register('endereco')}
                                    disabled={isViewMode}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                />
                            </div>

                            {/* Indicação */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Indicação</label>
                                <input
                                    type="text"
                                    {...register('indicacao')}
                                    disabled={isViewMode}
                                    placeholder="Nome de quem indicou"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                />
                            </div>

                            {/* Observações */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Observações</label>
                                <textarea
                                    {...register('observacoes')}
                                    disabled={isViewMode}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                />
                            </div>

                            {/* Status e Data */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Status *</label>
                                    <select
                                        {...register('status')}
                                        disabled={isViewMode}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                    >
                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Data de Inclusão *</label>
                                    <input
                                        type="date"
                                        {...register('data_inclusao')}
                                        disabled={isViewMode}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                    />
                                </div>
                            </div>

                            {/* Arquivo */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Arquivo do Currículo</label>
                                {selectedCurriculo?.arquivo_url && (
                                    <div className="flex items-center gap-2 mb-2 p-2 bg-blue-50 rounded-lg">
                                        <FileText size={16} className="text-blue-600" />
                                        <a
                                            href={selectedCurriculo.arquivo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-700 truncate"
                                        >
                                            {selectedCurriculo.arquivo_nome || 'Visualizar arquivo'}
                                        </a>
                                    </div>
                                )}
                                {!isViewMode && (
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setArquivoFile(e.target.files[0])}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                )}
                                {arquivoFile && <p className="text-xs text-slate-500">Novo: {arquivoFile.name}</p>}
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
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
                                    type="submit"
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Salvando...' : selectedCurriculo ? 'Salvar Alterações' : 'Cadastrar'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Novo Cargo */}
            {cargoModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setCargoModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-xl flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Novo Cargo</h3>
                            <button onClick={() => setCargoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={cargoForm.handleSubmit(onSubmitCargo)} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Nome do Cargo *</label>
                                <input
                                    type="text"
                                    {...cargoForm.register('nome')}
                                    placeholder="Ex: Supervisor de Segurança"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                {cargoForm.formState.errors.nome && <span className="text-xs text-red-500">{cargoForm.formState.errors.nome.message}</span>}
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setCargoModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Criar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Alterar Status */}
            {statusModalOpen && statusModalCurriculo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setStatusModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-xl flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">Alterar Status</h3>
                            <button onClick={() => setStatusModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                <strong>{statusModalCurriculo.nome_completo}</strong>
                            </p>
                            <div className="space-y-2">
                                {STATUS_OPTIONS.map(opt => {
                                    const config = STATUS_CONFIG[opt];
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => handleStatusChange(opt)}
                                            className={clsx(
                                                "w-full px-4 py-3 rounded-lg text-left flex items-center gap-3 transition-all border",
                                                opt === statusModalCurriculo.status
                                                    ? `${config.bg} ${config.text} ${config.border}`
                                                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                                            )}
                                        >
                                            <span className={clsx("w-3 h-3 rounded-full", config.bg, "border", config.border)} />
                                            <span className="font-medium">{opt}</span>
                                            {opt === statusModalCurriculo.status && (
                                                <span className="ml-auto text-xs">(atual)</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end">
                            <button
                                onClick={() => setStatusModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={confirmDelete}
                title="Excluir Currículo"
                message={`Tem certeza que deseja excluir o currículo de "${selectedCurriculo?.nome_completo}"?`}
                confirmLabel="Excluir"
                confirmColor="red"
            />
        </div>
    );
}
