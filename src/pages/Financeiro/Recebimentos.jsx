import { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle, Clock, DollarSign, AlertCircle, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// --- SERVIÇOS & UTILS ---
import { useToast } from '../../components/ui/Toast';
import { recebimentosService } from '../../services/recebimentosService';
import { empresasService } from '../../services/empresasService';
import { formatCurrency, formatDate, parseCurrency } from '../../utils/formatters';
import { getBorderColor } from '../../utils/styles';

// --- COMPONENTES UI ---
import CompanyTabs from '../../components/ui/CompanyTabs';
import CompanyBadge from '../../components/ui/CompanyBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import TableActionButtons from '../../components/ui/TableActionButtons';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import InputMask from '../../components/ui/InputMask';

// --- SCHEMA PARA RECEBIMENTO AVULSO ---
const recebimentoAvulsoSchema = z.object({
    empresa_id: z.string().min(1, 'Empresa obrigatória'),
    posto: z.string().min(1, 'Descrição obrigatória'),
    valor_receb: z.string().min(1, 'Valor obrigatório').transform(parseCurrency),
    data_vencimento: z.string().min(1, 'Data de vencimento obrigatória'),
    observacoes: z.string().optional()
});

// --- KPI CARD ---
const MetricCard = ({ title, value, icon: Icon, type = "default" }) => {
    const bgColors = {
        emerald: "bg-emerald-50 border-emerald-200",
        amber: "bg-amber-50 border-amber-200",
        blue: "bg-blue-50 border-blue-200",
        default: "bg-white border-slate-200"
    };
    const iconColors = {
        emerald: "text-emerald-600 bg-emerald-100",
        amber: "text-amber-600 bg-amber-100",
        blue: "text-blue-600 bg-blue-100",
        default: "text-slate-600 bg-slate-100"
    };
    return (
        <div className={`p-4 rounded-xl border shadow-sm flex items-center gap-4 ${bgColors[type] || bgColors.default}`}>
            <div className={`p-3 rounded-lg ${iconColors[type] || iconColors.default}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
};

export default function Recebimentos() {
    const { addToast } = useToast();

    // States
    const [recebimentos, setRecebimentos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [activeCompany, setActiveCompany] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [competencia, setCompetencia] = useState(format(new Date(), 'yyyy-MM'));

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [editingRecebimento, setEditingRecebimento] = useState(null);
    const [dataRecebimento, setDataRecebimento] = useState('');
    const [valorReceb, setValorReceb] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Confirmations
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    // Modal Novo Recebimento Avulso
    const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
    const [savingNovo, setSavingNovo] = useState(false);

    // Form para Novo Recebimento
    const {
        register: registerNovo,
        handleSubmit: handleSubmitNovo,
        reset: resetNovo,
        formState: { errors: errorsNovo }
    } = useForm({
        resolver: zodResolver(recebimentoAvulsoSchema)
    });

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const [recsResult, emps] = await Promise.all([
                recebimentosService.getAll(),
                empresasService.getAll()
            ]);
            setRecebimentos(recsResult.data || []);
            setEmpresas(emps || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao carregar recebimentos.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- MODAL ---
    const handleOpenModal = (recebimento, viewMode = false) => {
        setEditingRecebimento(recebimento);
        setDataRecebimento(recebimento.data_recebimento || format(new Date(), 'yyyy-MM-dd'));
        setValorReceb(formatCurrency(recebimento.valor_receb));
        setIsViewMode(viewMode);
        setIsModalOpen(true);
    };

    const handleSwitchToEdit = (e) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (editingRecebimento?.status === 'Recebido') {
            addToast({ type: 'warning', title: 'Atenção', message: 'Recebimentos já confirmados não podem ser editados.' });
            return;
        }
        setIsViewMode(false);
    };

    // --- ACTIONS ---
    const handleAction = (type, item) => {
        setConfirmAction({ type, item });
        setConfirmModalOpen(true);
    };

    const confirmActionHandler = async () => {
        if (!confirmAction) return;
        const { type, item } = confirmAction;
        try {
            if (type === 'receber') {
                await recebimentosService.marcarRecebido(item.id);
                addToast({ type: 'success', title: 'Recebido', message: 'Recebimento confirmado com sucesso.' });
            } else if (type === 'desfazer') {
                await recebimentosService.desfazerRecebimento(item.id);
                addToast({ type: 'success', title: 'Desfeito', message: 'Recebimento voltou para pendente.' });
            } else if (type === 'delete') {
                await recebimentosService.delete(item.id);
                addToast({ type: 'success', title: 'Excluído', message: 'Recebimento removido.' });
            }
            fetchData();
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao executar ação.' });
        } finally {
            setConfirmModalOpen(false);
            setConfirmAction(null);
        }
    };

    // --- HANDLER PARA NOVO RECEBIMENTO AVULSO ---
    const onSubmitNovo = async (data) => {
        try {
            setSavingNovo(true);
            const { error } = await recebimentosService.createAvulso(data);
            if (error) throw error;
            addToast({ type: 'success', title: 'Sucesso', message: 'Recebimento avulso criado.' });
            setIsNovoModalOpen(false);
            resetNovo();
            fetchData();
        } catch (err) {
            console.error(err);
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao criar recebimento.' });
        } finally {
            setSavingNovo(false);
        }
    };

    // Abre modal de novo recebimento
    const handleOpenNovoModal = () => {
        resetNovo({
            empresa_id: '',
            posto: '',
            valor_receb: '',
            data_vencimento: format(new Date(), 'yyyy-MM-dd'),
            observacoes: ''
        });
        setIsNovoModalOpen(true);
    };

    // --- FILTERS BY COMPETENCIA (MÊS/ANO) ---
    const filteredItems = recebimentos
        .filter(item => {
            // Filtro por mês de vencimento
            const itemDate = item.data_vencimento?.substring(0, 7);
            const matchesCompetencia = itemDate === competencia;
            const matchesCompany = activeCompany === 'all' ? true : item.empresa_id === activeCompany;
            const matchesSearch =
                item.posto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.empresas?.nome_empresa?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter;
            return matchesCompetencia && matchesCompany && matchesSearch && matchesStatus;
        })
        .sort((a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento));

    // --- KPIS ---
    const kpiTotal = filteredItems.reduce((acc, curr) => acc + Number(curr.valor_receb), 0);
    const kpiRecebido = filteredItems.filter(i => i.status === 'Recebido').reduce((acc, curr) => acc + Number(curr.valor_receb), 0);
    const kpiPendente = filteredItems.filter(i => i.status === 'Pendente').reduce((acc, curr) => acc + Number(curr.valor_receb), 0);

    return (
        <div className="space-y-6">
            {/* Header com filtro de mês */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Recebimentos</h1>
                    <p className="text-slate-500">Controle de valores a receber</p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="month"
                        value={competencia}
                        onChange={(e) => setCompetencia(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-slate-400 focus:outline-none"
                    />
                    <button
                        onClick={handleOpenNovoModal}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Novo Recebimento
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard title="Total a Receber" value={formatCurrency(kpiTotal)} icon={DollarSign} type="blue" />
                <MetricCard title="Recebido" value={formatCurrency(kpiRecebido)} icon={CheckCircle} type="emerald" />
                <MetricCard title="Pendente" value={formatCurrency(kpiPendente)} icon={Clock} type="amber" />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por posto ou empresa..."
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
                        <option value="Pendente">Pendentes</option>
                        <option value="Recebido">Recebidos</option>
                    </select>
                </div>
            </div>
            <CompanyTabs activeTab={activeCompany} onTabChange={setActiveCompany} empresas={empresas} />

            {/* Table (Desktop) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hidden md:block">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Data Venc.</th>
                            <th className="px-6 py-3">Posto</th>
                            <th className="px-6 py-3">Empresa</th>
                            <th className="px-6 py-3 text-right">Valor</th>
                            <th className="px-6 py-3 text-center">Status</th>
                            <th className="px-6 py-3 text-center">Data Receb.</th>
                            <th className="px-6 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="7" className="p-8 text-center text-slate-500">Carregando...</td></tr>
                        ) : filteredItems.length === 0 ? (
                            <tr><td colSpan="7" className="p-8 text-center text-slate-500">Nenhum recebimento encontrado para esta competência.</td></tr>
                        ) : filteredItems.map(item => (
                            <tr
                                key={item.id}
                                onClick={() => handleOpenModal(item, true)}
                                className={clsx(
                                    "hover:bg-slate-50 transition-colors cursor-pointer border-l-4",
                                    getBorderColor(item.empresas?.nome_empresa)
                                )}
                            >
                                <td className="px-6 py-4 text-sm font-medium text-slate-900">{formatDate(item.data_vencimento)}</td>
                                <td className="px-6 py-4 font-semibold text-slate-900">
                                    {item.posto}
                                    {item.tipo === 'Avulso' && <span className="ml-2 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Avulso</span>}
                                </td>
                                <td className="px-6 py-4"><CompanyBadge nomeEmpresa={item.empresas?.nome_empresa} /></td>
                                <td className="px-6 py-4 text-right font-bold text-emerald-600">{formatCurrency(item.valor_receb)}</td>
                                <td className="px-6 py-4 text-center">
                                    <StatusBadge value={item.status === 'Recebido'} trueLabel="Recebido" falseLabel="Pendente" />
                                </td>
                                <td className="px-6 py-4 text-center text-sm text-slate-600">
                                    {item.data_recebimento ? formatDate(item.data_recebimento) : '-'}
                                </td>
                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-2">
                                        {item.status === 'Pendente' ? (
                                            <>
                                                <button
                                                    onClick={() => handleAction('receber', item)}
                                                    title="Marcar como Recebido"
                                                    className="p-1 hover:bg-slate-100 rounded text-emerald-600"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <TableActionButtons
                                                    onView={() => handleOpenModal(item, true)}
                                                    onEdit={() => handleOpenModal(item, false)}
                                                    onDelete={() => handleAction('delete', item)}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleAction('desfazer', item)}
                                                    title="Desfazer Recebimento"
                                                    className="p-1 hover:bg-slate-100 rounded text-amber-600"
                                                >
                                                    <AlertCircle size={18} />
                                                </button>
                                                <TableActionButtons
                                                    onView={() => handleOpenModal(item, true)}
                                                />
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {filteredItems.length === 0 && (
                    <div className="bg-white p-8 rounded-lg text-center text-slate-500">
                        Nenhum recebimento encontrado para esta competência.
                    </div>
                )}
                {filteredItems.map(item => (
                    <div
                        key={item.id}
                        onClick={() => handleOpenModal(item, true)}
                        className={clsx(
                            "bg-white p-4 rounded-lg shadow-sm border-l-4 space-y-3 cursor-pointer",
                            getBorderColor(item.empresas?.nome_empresa)
                        )}
                    >
                        {/* Linha 1: Título + Status */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-900">
                                    {item.posto}
                                    {item.tipo === 'Avulso' && <span className="ml-2 text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Avulso</span>}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Venc: {formatDate(item.data_vencimento)}</p>
                                {item.data_recebimento && (
                                    <p className="text-xs text-emerald-600 mt-0.5">Receb: {formatDate(item.data_recebimento)}</p>
                                )}
                            </div>
                            <StatusBadge value={item.status === 'Recebido'} trueLabel="Recebido" falseLabel="Pendente" />
                        </div>

                        {/* Linha 2: Badges */}
                        <div className="flex gap-2 items-center flex-wrap">
                            <CompanyBadge nomeEmpresa={item.empresas?.nome_empresa} />
                        </div>

                        {/* Linha 3: Valor + Ações */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <div>
                                <p className="text-xs text-slate-500">Valor</p>
                                <span className="font-bold text-emerald-700">{formatCurrency(item.valor_receb)}</span>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                {item.status === 'Pendente' ? (
                                    <>
                                        <button
                                            onClick={() => handleAction('receber', item)}
                                            title="Marcar como Recebido"
                                            className="p-1.5 hover:bg-slate-100 rounded text-emerald-600"
                                        >
                                            <CheckCircle size={18} />
                                        </button>
                                        <TableActionButtons
                                            onView={() => handleOpenModal(item, true)}
                                            onEdit={() => handleOpenModal(item, false)}
                                            onDelete={() => handleAction('delete', item)}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleAction('desfazer', item)}
                                            title="Desfazer Recebimento"
                                            className="p-1.5 hover:bg-slate-100 rounded text-amber-600"
                                        >
                                            <AlertCircle size={18} />
                                        </button>
                                        <TableActionButtons
                                            onView={() => handleOpenModal(item, true)}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal View/Edit */}
            {isModalOpen && editingRecebimento && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">
                                {isViewMode ? 'Detalhes do Recebimento' : 'Editar Recebimento'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-medium">Posto</p>
                                        <p className="font-semibold text-slate-900">{editingRecebimento.posto}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-medium">Empresa</p>
                                        <p className="font-semibold text-slate-900">{editingRecebimento.empresas?.nome_empresa || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-medium">Vencimento</p>
                                        <p className="font-semibold text-slate-900">{formatDate(editingRecebimento.data_vencimento)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-medium">Status</p>
                                        <StatusBadge value={editingRecebimento.status === 'Recebido'} trueLabel="Recebido" falseLabel="Pendente" />
                                    </div>
                                </div>
                            </div>

                            {/* Valor a Receber */}
                            {isViewMode ? (
                                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 text-center">
                                    <p className="text-sm text-emerald-700 font-medium">Valor a Receber</p>
                                    <p className="text-3xl font-bold text-emerald-600">{formatCurrency(editingRecebimento.valor_receb)}</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">Valor a Receber</label>
                                    <InputMask
                                        mask="currency"
                                        value={valorReceb}
                                        onChange={(e) => setValorReceb(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                            )}

                            {/* Campo de edição de data de recebimento */}
                            {!isViewMode && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700">Data de Recebimento</label>
                                    <input
                                        type="date"
                                        value={dataRecebimento}
                                        onChange={(e) => setDataRecebimento(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                            )}
                            {isViewMode && editingRecebimento.data_recebimento && (
                                <div className="text-center text-sm text-slate-600">
                                    Recebido em: <strong>{formatDate(editingRecebimento.data_recebimento)}</strong>
                                </div>
                            )}
                        </div>

                        {/* Footer - Padrão Faturamentos */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                {isViewMode ? 'Fechar' : 'Cancelar'}
                            </button>

                            {isViewMode ? (
                                // Modo View: Botão Editar (apenas se Pendente)
                                editingRecebimento.status === 'Pendente' && (
                                    <button
                                        type="button"
                                        onClick={handleSwitchToEdit}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                    >
                                        Editar
                                    </button>
                                )
                            ) : (
                                // Modo Edit: Botão Salvar
                                <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={async () => {
                                        try {
                                            setActionLoading(true);
                                            await recebimentosService.update(editingRecebimento.id, {
                                                status: editingRecebimento.status,
                                                data_recebimento: dataRecebimento || null,
                                                valor_receb: parseCurrency(valorReceb),
                                                observacoes: editingRecebimento.observacoes
                                            });
                                            addToast({ type: 'success', title: 'Salvo', message: 'Data de recebimento atualizada.' });
                                            setIsModalOpen(false);
                                            fetchData();
                                        } catch (err) {
                                            console.error(err);
                                            addToast({ type: 'error', title: 'Erro', message: 'Erro ao salvar.' });
                                        } finally {
                                            setActionLoading(false);
                                        }
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {actionLoading ? 'Salvando...' : 'Salvar Dados'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={confirmActionHandler}
                title={
                    confirmAction?.type === 'receber' ? 'Confirmar Recebimento' :
                        confirmAction?.type === 'desfazer' ? 'Desfazer Recebimento' :
                            'Excluir Recebimento'
                }
                message={
                    confirmAction?.type === 'receber'
                        ? `Deseja confirmar o recebimento de ${formatCurrency(confirmAction?.item?.valor_receb)}?`
                        : confirmAction?.type === 'desfazer'
                            ? 'Deseja desfazer este recebimento? O status voltará para Pendente.'
                            : 'Tem certeza que deseja excluir este recebimento?'
                }
                confirmLabel={
                    confirmAction?.type === 'receber' ? 'Confirmar' :
                        confirmAction?.type === 'desfazer' ? 'Desfazer' :
                            'Excluir'
                }
                confirmColor={
                    confirmAction?.type === 'receber' ? 'emerald' :
                        confirmAction?.type === 'desfazer' ? 'amber' :
                            'red'
                }
            />

            {/* Modal Novo Recebimento Avulso */}
            {isNovoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsNovoModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">Novo Recebimento Avulso</h3>
                            <button onClick={() => setIsNovoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmitNovo(onSubmitNovo)} className="p-6 space-y-4">
                            {/* Empresa */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Empresa *</label>
                                <select
                                    {...registerNovo('empresa_id')}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Selecione...</option>
                                    {empresas.filter(e => e.ativo !== false).map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.nome_empresa}</option>
                                    ))}
                                </select>
                                {errorsNovo.empresa_id && <span className="text-xs text-red-500">{errorsNovo.empresa_id.message}</span>}
                            </div>

                            {/* Descrição/Posto */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Descrição *</label>
                                <input
                                    type="text"
                                    {...registerNovo('posto')}
                                    placeholder="Ex: Pagamento consultoria"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                {errorsNovo.posto && <span className="text-xs text-red-500">{errorsNovo.posto.message}</span>}
                            </div>

                            {/* Valor e Data Vencimento */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Valor *</label>
                                    <InputMask
                                        mask="currency"
                                        {...registerNovo('valor_receb')}
                                        placeholder="R$ 0,00"
                                        error={errorsNovo.valor_receb}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Data Vencimento *</label>
                                    <input
                                        type="date"
                                        {...registerNovo('data_vencimento')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errorsNovo.data_vencimento && <span className="text-xs text-red-500">{errorsNovo.data_vencimento.message}</span>}
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Observações</label>
                                <textarea
                                    {...registerNovo('observacoes')}
                                    rows={2}
                                    placeholder="Opcional"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Footer */}
                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsNovoModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingNovo}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {savingNovo ? 'Salvando...' : 'Criar Recebimento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
