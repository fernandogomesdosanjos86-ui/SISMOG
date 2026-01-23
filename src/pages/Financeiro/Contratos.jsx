import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Calendar, DollarSign, FileText, FileCheck, AlertTriangle, AlertCircle } from 'lucide-react';
import { format, addMonths, differenceInMonths } from 'date-fns';
import clsx from 'clsx'; // Adicionado para concatenação de classes

// --- SERVIÇOS & UTILS ---
import { useToast } from '../../components/ui/Toast';
import { contratosService } from '../../services/contratosService';
import { empresasService } from '../../services/empresasService';
import { normalizeCurrency, parseCurrency } from '../../utils/formatters';
import { getBorderColor } from '../../utils/styles'; // Importado para identidade visual

// --- COMPONENTES UI ---
import CompanyTabs from '../../components/ui/CompanyTabs';
import CompanyBadge from '../../components/ui/CompanyBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import TableActionButtons from '../../components/ui/TableActionButtons';
import TableFilters from '../../components/ui/TableFilters';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import InputMask from '../../components/ui/InputMask';

// --- SCHEMA DE VALIDAÇÃO ---
const contratoSchema = z.object({
    empresa_id: z.string().min(1, 'Empresa é obrigatória'),
    contratante: z.string().min(3, 'Contratante é obrigatório'),
    posto_trabalho: z.string().min(3, 'Posto de Trabalho é obrigatório'),
    cnpj_contratante: z.string().optional(),

    data_inicio: z.string().min(1, 'Data de início é obrigatória'),
    duracao_meses: z.coerce.number().min(1, 'Duração mínima de 1 mês'),

    valor_contrato: z.union([z.string(), z.number()])
        .transform((val) => parseCurrency(val))
        .refine((val) => val > 0, 'Valor deve ser maior que zero'),

    dia_faturamento: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.number().min(1).max(31).optional()),
    dia_vencimento: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.number().min(1).max(31).optional()),

    iss_perc: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.number().min(0).max(100).optional()),

    retencao_iss: z.boolean().default(false),
    retencao_pis: z.boolean().default(false),
    retencao_cofins: z.boolean().default(false),
    retencao_irpj: z.boolean().default(false),
    retencao_csll: z.boolean().default(false),
    retencao_inss: z.boolean().default(false),

    retencao_pagamento: z.boolean().default(false),
    retencao_pag_perc: z.any().optional(),

    vencimento_mes_corrente: z.boolean().default(true),
    ativo: z.boolean().default(true),
}).superRefine((data, ctx) => {
    if (data.retencao_pagamento) {
        const perc = Number(data.retencao_pag_perc);
        if (!perc || perc <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Percentual é obrigatório',
                path: ['retencao_pag_perc'],
            });
        }
    }
});

// --- COMPONENTE KPI CARD ---
const MetricCard = ({ title, value, icon: Icon, type = "default" }) => {
    const bgColors = {
        blue: "bg-blue-50 border-blue-200",
        amber: "bg-amber-50 border-amber-200",
        red: "bg-red-50 border-red-200",
        default: "bg-white border-slate-200"
    };
    const iconColors = {
        blue: "text-blue-600 bg-blue-100",
        amber: "text-amber-600 bg-amber-100",
        red: "text-red-600 bg-red-100",
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

export default function Contratos() {
    // CORREÇÃO 1: Usar addToast em vez de showToast
    const { addToast } = useToast();

    const [contratos, setContratos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCompany, setActiveCompany] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [editingContrato, setEditingContrato] = useState(null);

    // Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [contratoToDelete, setContratoToDelete] = useState(null);

    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(contratoSchema),
        defaultValues: {
            retencao_iss: false,
            retencao_pis: false,
            retencao_cofins: false,
            retencao_irpj: false,
            retencao_csll: false,
            retencao_inss: false,
            retencao_pagamento: false,
            vencimento_mes_corrente: true,
            ativo: true,
            duracao_meses: 12
        }
    });

    const onInvalid = (errors) => {
        console.error("Erro de Validação:", errors);
        const firstError = Object.values(errors)[0];
        addToast({
            type: 'error',
            title: 'Erro de Validação',
            message: firstError?.message || 'Verifique os campos obrigatórios.'
        });
    };

    const dataInicioWatch = watch('data_inicio');
    const duracaoWatch = watch('duracao_meses');
    const retencaoPagamentoWatch = watch('retencao_pagamento');

    const dataTerminoCalculada = dataInicioWatch && duracaoWatch
        ? format(addMonths(new Date(dataInicioWatch), Number(duracaoWatch)), 'dd/MM/yyyy')
        : '-';

    useEffect(() => {
        fetchData();
    }, [activeCompany]);

    async function fetchData() {
        try {
            setLoading(true);
            const [contratosData, empresasData] = await Promise.all([
                contratosService.getAll(activeCompany === 'all' ? null : activeCompany),
                empresasService.getAll()
            ]);
            setContratos(contratosData || []);
            setEmpresas(empresasData || []);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            addToast({ type: 'error', title: 'Erro', message: 'Falha ao carregar dados.' });
        } finally {
            setLoading(false);
        }
    }

    // --- HANDLERS ---
    function handleAddNew() {
        setEditingContrato(null);
        setIsViewMode(false);
        reset({
            empresa_id: activeCompany !== 'all' ? activeCompany : '',
            ativo: true,
            duracao_meses: 12,
            retencao_iss: false,
            retencao_pis: false,
            retencao_cofins: false,
            retencao_irpj: false,
            retencao_csll: false,
            retencao_inss: false,
            retencao_pagamento: false,
            vencimento_mes_corrente: true,
        });
        setIsModalOpen(true);
    }

    function handleEdit(contrato) {
        setEditingContrato(contrato);
        setIsViewMode(false);
        reset({
            ...contrato,
            // Sanitização para evitar erro "Expected string, received null" do Zod e warnings do React
            cnpj_contratante: contrato.cnpj_contratante || '',
            dia_faturamento: contrato.dia_faturamento || '',
            dia_vencimento: contrato.dia_vencimento || '',
            iss_perc: contrato.iss_perc || '',
            retencao_pag_perc: contrato.retencao_pag_perc || '',
            // Valor monetário
            valor_contrato: normalizeCurrency(contrato.valor_contrato * 100),
        });
        setIsModalOpen(true);
    }

    function handleView(contrato) {
        handleEdit(contrato);
        setIsViewMode(true);
    }

    function handleDeleteClick(contrato) {
        setContratoToDelete(contrato);
        setDeleteModalOpen(true);
    }

    async function confirmDelete() {
        try {
            if (contratoToDelete) {
                await contratosService.delete(contratoToDelete.id);
                addToast({ type: 'success', title: 'Sucesso', message: 'Contrato excluído.' });
                fetchData();
            }
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao excluir contrato.' });
        } finally {
            setDeleteModalOpen(false);
            setContratoToDelete(null);
        }
    }

    async function onSubmit(data) {
        try {
            const cleanData = {
                ...data,
                cnpj_contratante: data.cnpj_contratante || null,
                dia_faturamento: data.dia_faturamento ? Number(data.dia_faturamento) : null,
                dia_vencimento: data.dia_vencimento ? Number(data.dia_vencimento) : null,
                iss_perc: data.iss_perc ? Number(data.iss_perc) : null,
                retencao_pag_perc: data.retencao_pagamento && data.retencao_pag_perc ? Number(data.retencao_pag_perc) : null,
                duracao_meses: Number(data.duracao_meses),
                valor_contrato: Number(data.valor_contrato)
            };

            if (editingContrato) {
                await contratosService.update(editingContrato.id, cleanData);
                addToast({ type: 'success', title: 'Sucesso', message: 'Contrato atualizado.' });
            } else {
                await contratosService.create(cleanData);
                addToast({ type: 'success', title: 'Sucesso', message: 'Contrato criado.' });
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Erro no onSubmit:', error);
            addToast({ type: 'error', title: 'Erro', message: 'Verifique os dados.' });
        }
    }

    // --- FILTERS & SORTING ---
    const filteredContratos = contratos
        .filter(c =>
            c.contratante.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.posto_trabalho.toLowerCase().includes(searchTerm.toLowerCase())
        )
        // CORREÇÃO 4: Ordenação Alfabética por Posto
        .sort((a, b) => a.posto_trabalho.localeCompare(b.posto_trabalho));

    // --- HELPER BADGES ---
    const getMesesRestantes = (inicio, meses) => {
        if (!inicio || !meses) return null;
        const termino = addMonths(new Date(inicio), meses);
        return differenceInMonths(termino, new Date());
    };

    const getPrazoBadge = (inicio, meses) => {
        const mesesRestantes = getMesesRestantes(inicio, meses);
        if (mesesRestantes === null) return null;

        let colorClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        if (mesesRestantes < 1) {
            colorClass = 'bg-red-100 text-red-800 border-red-200';
        } else if (mesesRestantes < 3) {
            colorClass = 'bg-amber-100 text-amber-800 border-amber-200';
        }

        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
                {mesesRestantes <= 0 ? 'Vencido' : `${mesesRestantes} meses`}
            </span>
        );
    };

    const getRetencoesBadges = (contrato) => {
        const retencoes = [];
        if (contrato.retencao_iss) retencoes.push('ISS');
        if (contrato.retencao_pis) retencoes.push('PIS');
        if (contrato.retencao_cofins) retencoes.push('COFINS');
        if (contrato.retencao_irpj) retencoes.push('IRPJ');
        if (contrato.retencao_csll) retencoes.push('CSLL');
        if (contrato.retencao_inss) retencoes.push('INSS');
        if (retencoes.length === 0) return <span className="text-slate-400 text-xs">-</span>;

        return (
            <div className="flex flex-wrap gap-1">
                {retencoes.map(r => (
                    <span key={r} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium border border-slate-200">
                        {r}
                    </span>
                ))}
            </div>
        );
    };

    const kpiStats = {
        active: filteredContratos.filter(c => c.ativo).length,
        warning: filteredContratos.filter(c => {
            const meses = getMesesRestantes(c.data_inicio, c.duracao_meses);
            return meses !== null && meses > 0 && meses < 3;
        }).length,
        critical: filteredContratos.filter(c => {
            const meses = getMesesRestantes(c.data_inicio, c.duracao_meses);
            return meses !== null && meses > 0 && meses < 1;
        }).length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Contratos</h1>
                    <p className="text-slate-500">Gestão de contratos e faturamentos</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer active:scale-95 w-full md:w-auto justify-center"
                >
                    <Plus size={20} />
                    Novo Contrato
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard title="Contratos Ativos" value={kpiStats.active} icon={FileCheck} type="blue" />
                <MetricCard title="Atenção (3 meses)" value={kpiStats.warning} icon={AlertTriangle} type="amber" />
                <MetricCard title="Crítico (1 mês)" value={kpiStats.critical} icon={AlertCircle} type="red" />
            </div>

            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por contratante ou posto..."
            />

            <CompanyTabs activeTab={activeCompany} onTabChange={setActiveCompany} empresas={empresas} />

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Mobile View (Cards) */}
                <div className="md:hidden space-y-4 p-4">
                    {loading ? (
                        <p className="text-center text-slate-500 py-4">Carregando...</p>
                    ) : filteredContratos.length === 0 ? (
                        <p className="text-center text-slate-500 py-4">Nenhum contrato encontrado</p>
                    ) : (
                        filteredContratos.map(contrato => (
                            <div
                                key={contrato.id}
                                className={clsx(
                                    "bg-white p-4 rounded-lg shadow-sm border-l-4 space-y-3 cursor-pointer",
                                    getBorderColor(contrato.empresas?.nome_empresa) // CORREÇÃO 2: Identidade visual
                                )}
                                onClick={() => handleView(contrato)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        {/* Exibe o Posto com destaque no mobile também */}
                                        <h3 className="font-bold text-slate-900">{contrato.posto_trabalho}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">{contrato.contratante}</p>
                                    </div>
                                    <StatusBadge value={contrato.ativo} />
                                </div>

                                <div className="flex gap-2 items-center flex-wrap">
                                    {/* CORREÇÃO 3: Correção da prop empresaId -> nomeEmpresa */}
                                    <CompanyBadge nomeEmpresa={contrato.empresas?.nome_empresa} />
                                    {getPrazoBadge(contrato.data_inicio, contrato.duracao_meses)}
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                    <span className="font-bold text-slate-700">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contrato.valor_contrato)}
                                    </span>
                                    <TableActionButtons
                                        onEdit={() => handleEdit(contrato)}
                                        onDelete={() => handleDeleteClick(contrato)}
                                        onView={() => handleView(contrato)}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop View (Table) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium">
                            <tr>
                                {/* CORREÇÃO 4: Apenas Posto na primeira coluna */}
                                <th className="px-6 py-3 uppercase text-xs font-semibold">Posto de Trabalho</th>
                                <th className="px-6 py-3 uppercase text-xs font-semibold">Empresa</th>
                                <th className="px-6 py-3 uppercase text-xs font-semibold">Prazo</th>
                                <th className="px-6 py-3 uppercase text-xs font-semibold">Valor</th>
                                {/* Removida coluna ISS */}
                                <th className="px-6 py-3 uppercase text-xs font-semibold">Retenções</th>
                                <th className="px-6 py-3 uppercase text-xs font-semibold text-center">Status</th>
                                <th className="px-6 py-3 uppercase text-xs font-semibold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500">Carregando...</td></tr>
                            ) : filteredContratos.length === 0 ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-500">Nenhum contrato encontrado</td></tr>
                            ) : (
                                filteredContratos.map((contrato) => (
                                    <tr
                                        key={contrato.id}
                                        onClick={() => handleView(contrato)}
                                        className={clsx(
                                            "hover:bg-slate-50 transition-colors cursor-pointer border-l-4",
                                            getBorderColor(contrato.empresas?.nome_empresa) // Identidade Visual
                                        )}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{contrato.posto_trabalho}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{contrato.contratante}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {/* Badge corrigido */}
                                            <CompanyBadge nomeEmpresa={contrato.empresas?.nome_empresa} />
                                        </td>
                                        <td className="px-6 py-4">
                                            {getPrazoBadge(contrato.data_inicio, contrato.duracao_meses)}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-emerald-700">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contrato.valor_contrato)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getRetencoesBadges(contrato)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <StatusBadge value={contrato.ativo} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <TableActionButtons
                                                onEdit={() => handleEdit(contrato)}
                                                onDelete={() => handleDeleteClick(contrato)}
                                                onView={() => handleView(contrato)}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal CRUD */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-lg font-bold text-slate-900">
                                {isViewMode ? 'Detalhes do Contrato' : editingContrato ? 'Editar Contrato' : 'Novo Contrato'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="sr-only">Fechar</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8 overflow-y-auto">
                            {/* Seção 1: Dados Principais */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1 flex items-center gap-2">
                                    <FileText size={14} /> Dados Cadastrais
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Empresa *</label>
                                        <select
                                            {...register('empresa_id')}
                                            disabled={isViewMode}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 bg-white"
                                        >
                                            <option value="">Selecione...</option>
                                            {empresas.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.nome_empresa}</option>
                                            ))}
                                        </select>
                                        {errors.empresa_id && <span className="text-xs text-red-500">{errors.empresa_id.message}</span>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Contratante *</label>
                                        <input
                                            type="text"
                                            {...register('contratante')}
                                            disabled={isViewMode}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                        />
                                        {errors.contratante && <span className="text-xs text-red-500">{errors.contratante.message}</span>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">CNPJ Contratante</label>
                                        <Controller
                                            name="cnpj_contratante"
                                            control={control}
                                            render={({ field }) => (
                                                <InputMask
                                                    mask="cnpj"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    disabled={isViewMode}
                                                    placeholder="00.000.000/0000-00"
                                                />
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Posto de Trabalho *</label>
                                        <input
                                            type="text"
                                            {...register('posto_trabalho')}
                                            disabled={isViewMode}
                                            placeholder="Local da prestação do serviço"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                        />
                                        {errors.posto_trabalho && <span className="text-xs text-red-500">{errors.posto_trabalho.message}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Seção 2: Vigência e Valores */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1 flex items-center gap-2">
                                    <Calendar size={14} /> Vigência e Faturamento
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Data Início *</label>
                                        <input
                                            type="date"
                                            {...register('data_inicio')}
                                            disabled={isViewMode}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                        />
                                        {errors.data_inicio && <span className="text-xs text-red-500">{errors.data_inicio.message}</span>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Duração (Meses) *</label>
                                        <input
                                            type="number"
                                            {...register('duracao_meses')}
                                            disabled={isViewMode}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-500">Término (Previsto)</label>
                                        <input
                                            type="text"
                                            value={dataTerminoCalculada}
                                            readOnly
                                            disabled
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Valor Mensal (R$) *</label>
                                        <Controller
                                            name="valor_contrato"
                                            control={control}
                                            render={({ field }) => (
                                                <InputMask
                                                    mask="currency"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    disabled={isViewMode}
                                                    error={errors.valor_contrato}
                                                />
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Dia Faturamento</label>
                                        <input
                                            type="number"
                                            {...register('dia_faturamento')}
                                            disabled={isViewMode}
                                            placeholder="Ex: 1"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Dia Vencimento</label>
                                        <input
                                            type="number"
                                            {...register('dia_vencimento')}
                                            disabled={isViewMode}
                                            placeholder="Ex: 5"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                                            <input type="checkbox" {...register('vencimento_mes_corrente')} disabled={isViewMode} className="rounded text-blue-600 focus:ring-blue-500" />
                                            <div>
                                                <span className="text-sm font-medium text-slate-700">Vencimento no Mês Corrente</span>
                                                <p className="text-xs text-slate-500">Se desmarcado, o vencimento será no mês seguinte ao faturamento</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Seção 3: Impostos e Retenções */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1 flex items-center gap-2">
                                    <DollarSign size={14} /> Impostos e Retenções
                                </h3>

                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-6">
                                    <div className="max-w-[150px]">
                                        <label className="text-sm font-medium text-slate-700">% ISS</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            {...register('iss_perc')}
                                            disabled={isViewMode}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-white disabled:text-slate-500"
                                        />
                                    </div>

                                    {/* CORREÇÃO 5: Grids responsivos (grid-cols-1 ou 2 no mobile) */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Retenções Federais</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:border-blue-300 transition-colors">
                                                <input type="checkbox" {...register('retencao_pis')} disabled={isViewMode} className="rounded text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm text-slate-700">PIS</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:border-blue-300 transition-colors">
                                                <input type="checkbox" {...register('retencao_cofins')} disabled={isViewMode} className="rounded text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm text-slate-700">COFINS</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:border-blue-300 transition-colors">
                                                <input type="checkbox" {...register('retencao_csll')} disabled={isViewMode} className="rounded text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm text-slate-700">CSLL</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:border-blue-300 transition-colors">
                                                <input type="checkbox" {...register('retencao_irpj')} disabled={isViewMode} className="rounded text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm text-slate-700">IRPJ</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outras Retenções</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:border-blue-300 transition-colors">
                                                <input type="checkbox" {...register('retencao_inss')} disabled={isViewMode} className="rounded text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm text-slate-700">INSS</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded border border-slate-200 hover:border-blue-300 transition-colors">
                                                <input type="checkbox" {...register('retencao_iss')} disabled={isViewMode} className="rounded text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm text-slate-700">ISS</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-200">
                                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                            <label className="flex items-center gap-2 cursor-pointer min-w-[220px]">
                                                <input type="checkbox" {...register('retencao_pagamento')} disabled={isViewMode} className="rounded text-blue-600 focus:ring-blue-500" />
                                                <span className="text-sm font-bold text-slate-800">Retenção Técnica (Pagamento)</span>
                                            </label>

                                            {(retencaoPagamentoWatch || isViewMode) && (
                                                <div className="w-full md:w-auto flex items-center gap-2">
                                                    <span className="text-sm text-slate-600">Percentual:</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        {...register('retencao_pag_perc')}
                                                        disabled={isViewMode || !retencaoPagamentoWatch}
                                                        className="w-24 px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 bg-white"
                                                        placeholder="0.00"
                                                    />
                                                    <span className="text-sm text-slate-600">%</span>
                                                </div>
                                            )}
                                        </div>
                                        {errors.retencao_pag_perc && <div className="text-xs text-red-500 mt-1 ml-2">{errors.retencao_pag_perc.message}</div>}
                                    </div>
                                </div>
                            </div>

                            {/* Seção 4: Status */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <label className="flex items-center gap-2 cursor-pointer w-fit">
                                    <input type="checkbox" {...register('ativo')} disabled={isViewMode} className="rounded text-blue-600 focus:ring-blue-500 disabled:text-gray-400" />
                                    <span className="text-sm font-medium text-slate-700">Contrato Ativo</span>
                                </label>
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
                                    onClick={() => { setIsViewMode(false); }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Editar
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit(onSubmit, onInvalid)}
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
                title="Excluir Contrato"
                message={`Tem certeza que deseja excluir o contrato de ${contratoToDelete?.contratante}?`}
            />
        </div>
    );
}
