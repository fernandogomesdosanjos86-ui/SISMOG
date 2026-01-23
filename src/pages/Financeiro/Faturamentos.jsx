import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

// --- SERVIÇOS & UTILS ---
import { useToast } from '../../components/ui/Toast';
import { faturamentosService } from '../../services/faturamentosService';
import { empresasService } from '../../services/empresasService';
import { formatCurrency, parseCurrency, normalizeCurrency, formatDate } from '../../utils/formatters';
import { getBorderColor } from '../../utils/styles';

// --- COMPONENTES UI ---
import CompanyTabs from '../../components/ui/CompanyTabs';
import CompanyBadge from '../../components/ui/CompanyBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import TableActionButtons from '../../components/ui/TableActionButtons';
import TableFilters from '../../components/ui/TableFilters';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import InputMask from '../../components/ui/InputMask';

// --- SCHEMA ---
const faturamentoSchema = z.object({
    acrescimo: z.string().transform(parseCurrency).optional(),
    desconto: z.string().transform(parseCurrency).optional(),
    data_faturamento: z.string().min(1, 'Data do faturamento obrigatória'),
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

// Helper: Formata competência como "Mês de Ano"
const formatCompetencia = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = parseISO(dateString);
        // Capitaliza primeira letra do mês
        const formatted = format(date, "MMMM 'de' yyyy", { locale: ptBR });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
        return 'N/A';
    }
};

export default function Faturamentos() {
    const { addToast } = useToast();

    // States
    const [faturamentos, setFaturamentos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Filters
    const [competencia, setCompetencia] = useState(format(new Date(), 'yyyy-MM')); // Ex: 2023-10
    const [activeCompany, setActiveCompany] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'Pendente', 'Faturado'

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [editingFaturamento, setEditingFaturamento] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Delete/Status Modal
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'faturar', item: ... }

    // Form
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(faturamentoSchema)
    });

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const [fats, emps] = await Promise.all([
                faturamentosService.getAll(),
                empresasService.getAll()
            ]);
            // Filtrar por mês/ano usando data_faturamento
            // Formato: competencia = 'YYYY-MM', data_faturamento = 'YYYY-MM-DD'
            const filteredByMonth = (fats || []).filter(f => {
                const dataFat = f.data_faturamento || f.competencia;
                return dataFat && dataFat.startsWith(competencia);
            });
            setFaturamentos(filteredByMonth);
            setEmpresas(emps || []);
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: 'Falha ao carregar dados.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [competencia]); // Recarrega se mudar mês

    // --- GENERATION ---
    const handleGerar = async () => {
        if (!competencia) return;
        try {
            setGenerating(true);
            // CORREÇÃO: Passa apenas YYYY-MM, o service adiciona -01 internamente
            let totalCreated = 0;
            // Gera para todas as empresas ativas
            for (const emp of empresas) {
                if (!emp.ativo) continue;
                const result = await faturamentosService.gerarFaturamentos(competencia, emp.id);
                totalCreated += result.created;
            }

            if (totalCreated > 0) {
                addToast({ type: 'success', title: 'Sucesso', message: `${totalCreated} faturamentos gerados.` });
                fetchData();
            } else {
                addToast({ type: 'info', title: 'Info', message: 'Nenhum novo faturamento gerado.' });
            }
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao gerar faturamentos.' });
        } finally {
            setGenerating(false);
        }
    };

    // --- EDIT / VIEW ---
    const handleOpenModal = (faturamento, viewMode = false) => {
        setEditingFaturamento(faturamento);
        setIsViewMode(viewMode);

        reset({
            acrescimo: normalizeCurrency((faturamento.acrescimo || 0) * 100),
            desconto: normalizeCurrency((faturamento.desconto || 0) * 100),
            data_faturamento: faturamento.data_faturamento || faturamento.competencia?.split('T')[0] || '',
            data_vencimento: faturamento.data_vencimento,
            observacoes: faturamento.observacoes || ''
        });

        setIsModalOpen(true);
    };

    const handleSwitchToEdit = (e) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (editingFaturamento?.status !== 'Pendente') {
            addToast({ type: 'warning', title: 'Atenção', message: 'Apenas faturamentos pendentes podem ser editados.' });
            return;
        }
        setIsViewMode(false);
    };

    // --- LIVE RECALCULATION (WATCH) ---
    const acrescimoWatch = watch('acrescimo');
    const descontoWatch = watch('desconto');

    // Cálculos em tempo real para exibição no modal
    const calculatedValues = (() => {
        if (!editingFaturamento) return { liquido: 0, recebimento: 0 };

        const bruto = Number(editingFaturamento.valor_bruto);
        const impostos =
            Number(editingFaturamento.iss_valor) +
            Number(editingFaturamento.pis_valor) +
            Number(editingFaturamento.cofins_valor) +
            Number(editingFaturamento.irpj_valor) +
            Number(editingFaturamento.csll_valor) +
            Number(editingFaturamento.inss_valor);

        const retencaoTecnica = Number(editingFaturamento.retencao_tec_valor);

        const acr = parseCurrency(acrescimoWatch);
        const desc = parseCurrency(descontoWatch);

        const liquido = bruto - impostos + acr - desc;
        const recebimento = liquido - retencaoTecnica;

        return { liquido, recebimento };
    })();

    // --- SUBMIT ---
    const onSubmit = async (data) => {
        try {
            setActionLoading(true);
            const acrescimo = parseCurrency(data.acrescimo);
            const desconto = parseCurrency(data.desconto);

            // Payload seguro (Calcula totais novamente para salvar consistente)
            // Recalcula totais baseados nos novos acresimos/descontos
            // Nota: Impostos e bruto não mudam na edição, são snapshots.
            const bruto = Number(editingFaturamento.valor_bruto);
            const impostos =
                Number(editingFaturamento.iss_valor) +
                Number(editingFaturamento.pis_valor) +
                Number(editingFaturamento.cofins_valor) +
                Number(editingFaturamento.irpj_valor) +
                Number(editingFaturamento.csll_valor) +
                Number(editingFaturamento.inss_valor);
            const retencaoTecnica = Number(editingFaturamento.retencao_tec_valor);

            const liquido = bruto - impostos + acrescimo - desconto;
            const recebimento = liquido - retencaoTecnica;

            const payload = {
                acrescimo,
                desconto,
                data_faturamento: data.data_faturamento,
                competencia: data.data_faturamento, // Competência segue a data do faturamento para cálculos de tributos
                data_vencimento: data.data_vencimento,
                observacoes: data.observacoes,
                valor_liquido: liquido,
                valor_recebimento: recebimento
            };

            await faturamentosService.update(editingFaturamento.id, payload);
            addToast({ type: 'success', title: 'Sucesso', message: 'Faturamento atualizado.' });
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao salvar.' });
        } finally {
            setActionLoading(false);
        }
    };

    // --- ACTIONS (Status / Delete) ---
    const handleAction = (type, item) => {
        setConfirmAction({ type, item });
        setConfirmModalOpen(true);
    };

    const confirmActionHandler = async () => {
        if (!confirmAction) return;
        const { type, item } = confirmAction;
        try {
            if (type === 'delete') {
                await faturamentosService.delete(item.id);
                addToast({ type: 'success', title: 'Excluído', message: 'Faturamento removido.' });
            } else if (type === 'faturar') {
                // Passa o item completo para criar recebimento automaticamente
                await faturamentosService.updateStatus(item.id, 'Faturado', item);
                addToast({ type: 'success', title: 'Faturado', message: 'Faturamento confirmado. Recebimento criado.' });
            } else if (type === 'desfazer') {
                // Usa desfazerFaturamento para excluir recebimento
                await faturamentosService.desfazerFaturamento(item.id);
                addToast({ type: 'success', title: 'Pendente', message: 'Faturamento desfeito. Recebimento excluído.' });
            }
            fetchData();
        } catch (error) {
            addToast({ type: 'error', title: 'Erro', message: 'Falha na operação.' });
        } finally {
            setConfirmModalOpen(false);
            setConfirmAction(null);
        }
    };

    // --- FILTERS ---
    const filteredItems = faturamentos
        .filter(item => {
            const matchesCompany = activeCompany === 'all' ? true : item.empresa_id === activeCompany;
            const matchesSearch =
                item.contratos?.posto_trabalho?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.empresas?.nome_empresa?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter;
            return matchesCompany && matchesSearch && matchesStatus;
        })
        .sort((a, b) => new Date(a.data_faturamento) - new Date(b.data_faturamento)); // Ordem crescente por data de faturamento

    // --- KPIS ---
    const kpiTotal = filteredItems.reduce((acc, curr) => acc + Number(curr.valor_bruto), 0);
    const kpiFaturado = filteredItems.filter(i => i.status === 'Faturado').reduce((acc, curr) => acc + Number(curr.valor_bruto), 0);
    const kpiPendente = filteredItems.filter(i => i.status === 'Pendente').reduce((acc, curr) => acc + Number(curr.valor_bruto), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Faturamentos</h1>
                    <p className="text-slate-500">Gestão de faturamento mensal e previsões</p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="month"
                        value={competencia}
                        onChange={(e) => setCompetencia(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-slate-400 focus:outline-none"
                    />
                    <button
                        onClick={handleGerar}
                        disabled={generating}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {generating ? <span className="animate-spin">⏳</span> : <Plus className="h-5 w-5" />}
                        Gerar Faturamentos
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard title="Total Bruto" value={formatCurrency(kpiTotal)} icon={FileText} type="blue" />
                <MetricCard title="Faturado" value={formatCurrency(kpiFaturado)} icon={CheckCircle} type="emerald" />
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
                        <option value="Faturado">Faturados</option>
                    </select>
                </div>
            </div>
            <CompanyTabs activeTab={activeCompany} onTabChange={setActiveCompany} empresas={empresas} />

            {/* Table (Desktop) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hidden md:block">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Data Fat.</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Posto / Contrato</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Empresa</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Fat. Bruto</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Fat. Líquido</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Valor Receb.</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredItems.map(item => (
                            <tr
                                key={item.id}
                                onClick={() => handleOpenModal(item, true)}
                                className={clsx("hover:bg-slate-50 transition-colors cursor-pointer border-l-4", getBorderColor(item.empresas?.nome_empresa))}
                            >
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {formatDate(item.data_faturamento || item.competencia)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-medium text-slate-900">{item.contratos?.posto_trabalho || 'N/A'}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <CompanyBadge nomeEmpresa={item.empresas?.nome_empresa} />
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-slate-900">
                                    {formatCurrency(item.valor_bruto)}
                                </td>
                                <td className="px-6 py-4 text-right text-slate-700">
                                    {formatCurrency(item.valor_liquido)}
                                </td>
                                <td className="px-6 py-4 text-right text-slate-500">
                                    {formatCurrency(item.valor_recebimento)}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <StatusBadge value={item.status === 'Faturado'} trueLabel="Faturado" falseLabel="Pendente" />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        {/* Ações Customizadas */}
                                        {item.status === 'Pendente' && (
                                            <>
                                                <button onClick={() => handleAction('faturar', item)} title="Marcar como Faturado" className="p-1 hover:bg-slate-100 rounded text-emerald-600">
                                                    <CheckCircle size={18} />
                                                </button>
                                                <TableActionButtons
                                                    onView={() => handleOpenModal(item, true)}
                                                    onEdit={() => handleOpenModal(item, false)}
                                                    onDelete={() => handleAction('delete', item)}
                                                />
                                            </>
                                        )}
                                        {item.status === 'Faturado' && (
                                            <>
                                                <button onClick={() => handleAction('desfazer', item)} title="Desfazer Faturamento" className="p-1 hover:bg-slate-100 rounded text-amber-600">
                                                    <AlertCircle size={18} />
                                                </button>
                                                <TableActionButtons onView={() => handleOpenModal(item, true)} />
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredItems.length === 0 && <div className="p-8 text-center text-slate-500">Nenhum faturamento encontrado para esta competência.</div>}
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {filteredItems.length === 0 && (
                    <div className="bg-white p-8 rounded-lg text-center text-slate-500">
                        Nenhum faturamento encontrado para esta competência.
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
                                <h3 className="font-bold text-slate-900">{item.contratos?.posto_trabalho || 'N/A'}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Fat: {formatDate(item.data_faturamento || item.competencia)}</p>
                            </div>
                            <StatusBadge value={item.status === 'Faturado'} trueLabel="Faturado" falseLabel="Pendente" />
                        </div>

                        {/* Linha 2: Badges */}
                        <div className="flex gap-2 items-center flex-wrap">
                            <CompanyBadge nomeEmpresa={item.empresas?.nome_empresa} />
                        </div>

                        {/* Linha 3: Valores + Ações */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <div className="flex gap-4">
                                <div>
                                    <p className="text-xs text-slate-500">Bruto</p>
                                    <span className="font-bold text-slate-700">{formatCurrency(item.valor_bruto)}</span>
                                </div>
                                <div>
                                    <p className="text-xs text-emerald-600">Receber</p>
                                    <span className="font-bold text-emerald-700">{formatCurrency(item.valor_recebimento)}</span>
                                </div>
                            </div>
                            <TableActionButtons
                                onView={() => handleOpenModal(item, true)}
                                onEdit={() => handleOpenModal(item, false)}
                                onDelete={() => handleAction('delete', item)}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Edit/View */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Modal Header (Padrão Visual) */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">
                                {isViewMode ? 'Detalhes do Faturamento' : 'Editar Faturamento'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="overflow-y-auto p-6 space-y-6">

                            {/* Seção 1: Dados Gerais */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1 flex items-center gap-2">
                                    <FileText size={14} /> Dados do Faturamento
                                </h4>
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-medium">Posto de Trabalho</p>
                                            <p className="font-semibold text-slate-900">{editingFaturamento?.contratos?.posto_trabalho || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-medium">Empresa</p>
                                            <p className="font-semibold text-slate-900">{editingFaturamento?.empresas?.nome_empresa || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-medium">Competência</p>
                                            <p className="font-semibold text-slate-900">{formatCompetencia(editingFaturamento?.competencia)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-medium">Status</p>
                                            <StatusBadge value={editingFaturamento?.status === 'Faturado'} trueLabel="Faturado" falseLabel="Pendente" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Seção 2: Impostos e Retenções (Visível em View Mode) */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1 flex items-center gap-2">
                                    <AlertCircle size={14} /> Impostos e Retenções
                                </h4>
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                        {/* ISS */}
                                        <div className={clsx("p-3 rounded-lg border", editingFaturamento?.iss_retido ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200")}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-slate-700">ISS</span>
                                                {editingFaturamento?.iss_retido ? (
                                                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Retido</span>
                                                ) : (
                                                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Não</span>
                                                )}
                                            </div>
                                            <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(editingFaturamento?.iss_valor || 0)}</p>
                                        </div>
                                        {/* PIS */}
                                        <div className={clsx("p-3 rounded-lg border", editingFaturamento?.pis_retido ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200")}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-slate-700">PIS</span>
                                                {editingFaturamento?.pis_retido ? (
                                                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Retido</span>
                                                ) : (
                                                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Não</span>
                                                )}
                                            </div>
                                            <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(editingFaturamento?.pis_valor || 0)}</p>
                                        </div>
                                        {/* COFINS */}
                                        <div className={clsx("p-3 rounded-lg border", editingFaturamento?.cofins_retido ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200")}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-slate-700">COFINS</span>
                                                {editingFaturamento?.cofins_retido ? (
                                                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Retido</span>
                                                ) : (
                                                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Não</span>
                                                )}
                                            </div>
                                            <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(editingFaturamento?.cofins_valor || 0)}</p>
                                        </div>
                                        {/* IRPJ */}
                                        <div className={clsx("p-3 rounded-lg border", editingFaturamento?.irpj_retido ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200")}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-slate-700">IRPJ</span>
                                                {editingFaturamento?.irpj_retido ? (
                                                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Retido</span>
                                                ) : (
                                                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Não</span>
                                                )}
                                            </div>
                                            <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(editingFaturamento?.irpj_valor || 0)}</p>
                                        </div>
                                        {/* CSLL */}
                                        <div className={clsx("p-3 rounded-lg border", editingFaturamento?.csll_retido ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200")}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-slate-700">CSLL</span>
                                                {editingFaturamento?.csll_retido ? (
                                                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Retido</span>
                                                ) : (
                                                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Não</span>
                                                )}
                                            </div>
                                            <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(editingFaturamento?.csll_valor || 0)}</p>
                                        </div>
                                        {/* INSS */}
                                        <div className={clsx("p-3 rounded-lg border", editingFaturamento?.inss_retido ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200")}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-slate-700">INSS</span>
                                                {editingFaturamento?.inss_retido ? (
                                                    <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Retido</span>
                                                ) : (
                                                    <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Não</span>
                                                )}
                                            </div>
                                            <p className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(editingFaturamento?.inss_valor || 0)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Seção 3: Valores Financeiros */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1 flex items-center gap-2">
                                    <CheckCircle size={14} /> Valores Financeiros
                                </h4>

                                <form onSubmit={handleSubmit(onSubmit)} id="faturamento-form" className="space-y-4">
                                    {/* Valor Bruto (Readonly) */}
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-blue-700">Valor Bruto (Base)</span>
                                            <span className="text-2xl font-bold text-blue-900">{formatCurrency(editingFaturamento?.valor_bruto)}</span>
                                        </div>
                                    </div>

                                    {/* Campos Editáveis */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700">Acréscimo (R$)</label>
                                            <InputMask
                                                mask="currency"
                                                disabled={isViewMode}
                                                register={register('acrescimo')}
                                                error={errors.acrescimo}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700">Desconto (R$)</label>
                                            <InputMask
                                                mask="currency"
                                                disabled={isViewMode}
                                                register={register('desconto')}
                                                error={errors.desconto}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700">Data do Faturamento</label>
                                            <input
                                                type="date"
                                                disabled={isViewMode}
                                                {...register('data_faturamento')}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                            />
                                            {errors.data_faturamento && <span className="text-xs text-red-500">{errors.data_faturamento.message}</span>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700">Data Vencimento</label>
                                            <input
                                                type="date"
                                                disabled={isViewMode}
                                                {...register('data_vencimento')}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                            />
                                            {errors.data_vencimento && <span className="text-xs text-red-500">{errors.data_vencimento.message}</span>}
                                        </div>
                                    </div>

                                    {/* Observações */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Observações</label>
                                        <textarea
                                            rows={2}
                                            disabled={isViewMode}
                                            {...register('observacoes')}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                        />
                                    </div>

                                    {/* Totais Calculados */}
                                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600">Retenção Técnica</span>
                                            <span className="font-bold text-slate-700">{formatCurrency(editingFaturamento?.retencao_tec_valor)}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-emerald-200 pt-3">
                                            <span className="text-sm font-medium text-slate-700">Valor Líquido (Fiscal)</span>
                                            <span className="text-xl font-bold text-slate-900">{formatCurrency(calculatedValues.liquido)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-emerald-700">Valor Recebimento (Caixa)</span>
                                            <span className="text-2xl font-bold text-emerald-600">{formatCurrency(calculatedValues.recebimento)}</span>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Modal Footer (Padrão Visual) */}
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
                                    type="button"
                                    onClick={handleSwitchToEdit}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Editar
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    form="faturamento-form"
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {actionLoading && <span className="animate-spin text-xs">⏳</span>}
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
                title={confirmAction?.type === 'delete' ? "Excluir Faturamento" : "Alterar Status"}
                message={confirmAction?.type === 'delete'
                    ? "Tem certeza que deseja excluir? Isso não pode ser desfeito."
                    : `Deseja alterar o status para ${confirmAction?.type === 'faturar' ? 'Faturado' : 'Pendente'}?`}
                onConfirm={confirmActionHandler}
                onCancel={() => setConfirmModalOpen(false)}
            />
        </div>
    );
}
