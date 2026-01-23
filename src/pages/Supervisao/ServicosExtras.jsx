import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Clock, Users, DollarSign, Calendar, Briefcase, X } from 'lucide-react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

// --- SERVIÇOS & UTILS ---
import { useToast } from '../../components/ui/Toast';
import { servicosExtrasService } from '../../services/servicosExtrasService';
import { empresasService } from '../../services/empresasService';
import { funcionariosService } from '../../services/funcionariosService';
import { contratosService } from '../../services/contratosService';
import { cargosSalariosService } from '../../services/cargosSalariosService';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getBorderColor } from '../../utils/styles';

// --- COMPONENTES UI ---
import CompanyTabs from '../../components/ui/CompanyTabs';
import CompanyBadge from '../../components/ui/CompanyBadge';
import TableActionButtons from '../../components/ui/TableActionButtons';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

// --- SCHEMA ---
const lancamentoSchema = z.object({
    empresa_id: z.string().min(1, 'Empresa obrigatória'),
    contrato_id: z.string().min(1, 'Posto obrigatório'),
    funcionario_id: z.string().min(1, 'Funcionário obrigatório'),
    cargo_id: z.string().min(1, 'Cargo obrigatório'),
    turno: z.enum(['Diurno', 'Noturno'], { required_error: 'Turno obrigatório' }),
    data_entrada: z.string().min(1, 'Data/hora entrada obrigatória'),
    data_saida: z.string().min(1, 'Data/hora saída obrigatória'),
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

// --- HELPER: Formatar duração ---
const formatDuracao = (horas) => {
    const h = Math.floor(horas);
    const m = Math.round((horas - h) * 60);
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
};

// --- HELPER: Calcular duração em horas ---
const calcularDuracaoHoras = (dataEntrada, dataSaida) => {
    if (!dataEntrada || !dataSaida) return 0;
    const minutos = differenceInMinutes(new Date(dataSaida), new Date(dataEntrada));
    return Math.round((minutos / 60) * 100) / 100;
};

// --- HELPER: Arredondamento especial (apenas para valor total) ---
const arredondarValor = (valor) => {
    const centavos = Math.round((valor * 100) % 100);
    const segundaCasa = centavos % 10;
    if (segundaCasa >= 6) {
        return Math.ceil(valor * 10) / 10;
    }
    return Math.round(valor * 100) / 100;
};

export default function ServicosExtras() {
    const { addToast } = useToast();

    // States
    const [funcionariosAgrupados, setFuncionariosAgrupados] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [contratos, setContratos] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [competencia, setCompetencia] = useState(format(new Date(), 'yyyy-MM'));
    const [activeCompany, setActiveCompany] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isLancamentoModalOpen, setIsLancamentoModalOpen] = useState(false);
    const [selectedFuncionario, setSelectedFuncionario] = useState(null);
    const [editingLancamento, setEditingLancamento] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Confirmation
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    // Valor calculado em tempo real no modal
    const [valorCalculado, setValorCalculado] = useState({ valorHora: 0, valorTotal: 0, duracao: 0, valorDiaria: 0 });

    // Form
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(lancamentoSchema)
    });

    // Watch para cálculo em tempo real
    const watchEmpresa = watch('empresa_id');
    const watchCargo = watch('cargo_id');
    const watchTurno = watch('turno');
    const watchEntrada = watch('data_entrada');
    const watchSaida = watch('data_saida');

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const [agrupados, emps, conts, funcs, cargsData] = await Promise.all([
                servicosExtrasService.getAgrupadoPorFuncionario(competencia),
                empresasService.getAll(),
                contratosService.getAll(),
                funcionariosService.getAll(),
                cargosSalariosService.getAll()
            ]);
            setFuncionariosAgrupados(agrupados || []);
            setEmpresas(emps || []);
            setContratos(conts || []);
            setFuncionarios(funcs || []);
            setCargos(cargsData || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao carregar dados.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [competencia]);

    // Efeito para cálculo em tempo real
    useEffect(() => {
        if (watchCargo && watchTurno && watchEntrada && watchSaida) {
            const cargoSelecionado = cargos.find(c => c.id === watchCargo);
            if (cargoSelecionado) {
                const valorDiaria = watchTurno === 'Diurno'
                    ? Number(cargoSelecionado.servico_extra_diurno_valor || 0)
                    : Number(cargoSelecionado.servico_extra_noturno_valor || 0);

                const duracao = calcularDuracaoHoras(watchEntrada, watchSaida);
                const valorHora = Math.round((valorDiaria / 12) * 100) / 100; // Apenas 2 casas, sem arredondamento especial
                const valorTotal = arredondarValor(duracao * valorHora); // Arredondamento especial apenas no total

                setValorCalculado({ valorHora, valorTotal, duracao, valorDiaria });
            }
        }
    }, [watchCargo, watchTurno, watchEntrada, watchSaida, cargos]);

    // --- FILTROS ---
    const contratosFiltrados = useMemo(() => {
        if (!watchEmpresa) return [];
        return contratos.filter(c => c.empresa_id === watchEmpresa && c.ativo !== false);
    }, [watchEmpresa, contratos]);

    const funcionariosFiltrados = useMemo(() => {
        if (!watchEmpresa) return [];
        return funcionarios.filter(f => f.empresa_id === watchEmpresa && f.ativo !== false);
    }, [watchEmpresa, funcionarios]);

    // Filtragem de funcionários agrupados
    const filteredItems = useMemo(() => {
        return funcionariosAgrupados.filter(item => {
            const matchesSearch = item.funcionario_nome?.toLowerCase().includes(searchTerm.toLowerCase());

            // Se aba "Todas", mostra todos
            if (activeCompany === 'all') return matchesSearch;

            // Se aba de empresa específica, filtra por empresa dos lançamentos
            const temLancamentoNaEmpresa = item.lancamentos.some(l => l.empresa_id === activeCompany);
            return matchesSearch && temLancamentoNaEmpresa;
        });
    }, [funcionariosAgrupados, searchTerm, activeCompany]);

    // --- KPIs DINÂMICOS ---
    const kpis = useMemo(() => {
        const totais = { geral: 0 };
        empresas.forEach(emp => {
            totais[emp.id] = { nome: emp.nome_empresa, valor: 0 };
        });

        // Filtrar dados conforme aba ativa
        const dadosParaKpi = activeCompany === 'all'
            ? funcionariosAgrupados
            : funcionariosAgrupados.map(f => ({
                ...f,
                lancamentos: f.lancamentos.filter(l => l.empresa_id === activeCompany),
                total: f.lancamentos.filter(l => l.empresa_id === activeCompany).reduce((acc, l) => acc + Number(l.valor_total), 0)
            })).filter(f => f.lancamentos.length > 0);

        dadosParaKpi.forEach(func => {
            func.lancamentos.forEach(lanc => {
                totais.geral += Number(lanc.valor_total);
                if (totais[lanc.empresa_id]) {
                    totais[lanc.empresa_id].valor += Number(lanc.valor_total);
                }
            });
        });

        return totais;
    }, [funcionariosAgrupados, empresas, activeCompany]);

    // --- HANDLERS ---
    const handleOpenView = (funcionario) => {
        setSelectedFuncionario(funcionario);
        setIsViewModalOpen(true);
    };

    const handleOpenNovoLancamento = (funcionarioPreSelecionado = null) => {
        setEditingLancamento(null);
        reset({
            empresa_id: '',
            contrato_id: '',
            funcionario_id: funcionarioPreSelecionado?.funcionario_id || '',
            cargo_id: '',
            turno: 'Diurno',
            data_entrada: '',
            data_saida: '',
            observacoes: ''
        });
        setValorCalculado({ valorHora: 0, valorTotal: 0, duracao: 0, valorDiaria: 0 });
        setIsLancamentoModalOpen(true);
    };

    const handleOpenEditLancamento = (lancamento) => {
        setEditingLancamento(lancamento);
        reset({
            empresa_id: lancamento.empresa_id,
            contrato_id: lancamento.contrato_id,
            funcionario_id: lancamento.funcionario_id,
            cargo_id: lancamento.cargo_id,
            turno: lancamento.turno,
            data_entrada: lancamento.data_entrada?.slice(0, 16) || '',
            data_saida: lancamento.data_saida?.slice(0, 16) || '',
            observacoes: lancamento.observacoes || ''
        });
        setValorCalculado({
            valorHora: lancamento.valor_hora,
            valorTotal: lancamento.valor_total,
            duracao: lancamento.duracao_horas,
            valorDiaria: lancamento.valor_diaria
        });
        setIsLancamentoModalOpen(true);
    };

    const onSubmitLancamento = async (data) => {
        try {
            setActionLoading(true);

            const payload = {
                ...data,
                data_entrada: new Date(data.data_entrada).toISOString(),
                data_saida: new Date(data.data_saida).toISOString()
            };

            if (editingLancamento) {
                await servicosExtrasService.update(editingLancamento.id, payload);
                addToast({ type: 'success', title: 'Sucesso', message: 'Lançamento atualizado.' });
            } else {
                await servicosExtrasService.create(payload);
                addToast({ type: 'success', title: 'Sucesso', message: 'Lançamento criado.' });
            }

            setIsLancamentoModalOpen(false);
            setIsViewModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            addToast({ type: 'error', title: 'Erro', message: error?.message || 'Erro ao salvar lançamento.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteLancamento = (lancamento) => {
        setConfirmAction({ type: 'deleteLancamento', item: lancamento });
        setConfirmModalOpen(true);
    };

    const handleDeleteFuncionario = (funcionario) => {
        setConfirmAction({ type: 'deleteFuncionario', item: funcionario });
        setConfirmModalOpen(true);
    };

    const confirmActionHandler = async () => {
        if (!confirmAction) return;
        const { type, item } = confirmAction;

        try {
            if (type === 'deleteLancamento') {
                await servicosExtrasService.delete(item.id);
                addToast({ type: 'success', title: 'Excluído', message: 'Lançamento removido.' });
            } else if (type === 'deleteFuncionario') {
                await servicosExtrasService.deleteAllByFuncionario(item.funcionario_id, competencia);
                addToast({ type: 'success', title: 'Excluído', message: 'Todos os lançamentos do funcionário foram removidos.' });
                setIsViewModalOpen(false);
            }
            fetchData();
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao excluir.' });
        } finally {
            setConfirmModalOpen(false);
            setConfirmAction(null);
        }
    };

    // Calcular total do funcionário na aba ativa
    const getTotalFuncionarioNaAba = (funcionario) => {
        if (activeCompany === 'all') return funcionario.total;
        return funcionario.lancamentos
            .filter(l => l.empresa_id === activeCompany)
            .reduce((acc, l) => acc + Number(l.valor_total), 0);
    };

    const getQtdFuncionarioNaAba = (funcionario) => {
        if (activeCompany === 'all') return funcionario.qtd;
        return funcionario.lancamentos.filter(l => l.empresa_id === activeCompany).length;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Serviços Extras</h1>
                    <p className="text-slate-500">Gestão de lançamentos de serviços extras</p>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="month"
                        value={competencia}
                        onChange={(e) => setCompetencia(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-slate-400 focus:outline-none"
                    />
                    <button
                        onClick={() => handleOpenNovoLancamento()}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Adicionar Lançamento
                    </button>
                </div>
            </div>

            {/* KPIs Dinâmicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard title="Total Geral" value={formatCurrency(kpis.geral)} icon={DollarSign} type="blue" />
                {empresas.filter(e => e.ativo !== false).map(emp => (
                    <MetricCard
                        key={emp.id}
                        title={`Total ${emp.nome_empresa}`}
                        value={formatCurrency(kpis[emp.id]?.valor || 0)}
                        icon={Briefcase}
                        type={emp.nome_empresa?.toLowerCase().includes('femog') ? 'emerald' : 'amber'}
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
                        placeholder="Buscar por funcionário..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
            </div>
            <CompanyTabs activeTab={activeCompany} onTabChange={setActiveCompany} empresas={empresas} />

            {/* Table (Desktop) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hidden md:block">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Funcionário</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Qtd Lançamentos</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Total (R$)</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {loading ? (
                            <tr><td colSpan="4" className="p-8 text-center text-slate-500">Carregando...</td></tr>
                        ) : filteredItems.length === 0 ? (
                            <tr><td colSpan="4" className="p-8 text-center text-slate-500">Nenhum lançamento encontrado para esta competência.</td></tr>
                        ) : filteredItems.map(item => (
                            <tr
                                key={item.funcionario_id}
                                onClick={() => handleOpenView(item)}
                                className={clsx(
                                    "hover:bg-slate-50 transition-colors cursor-pointer border-l-4",
                                    getBorderColor(empresas.find(e => e.id === item.funcionario_empresa_id)?.nome_empresa)
                                )}
                            >
                                <td className="px-6 py-4">
                                    <span className="font-bold text-slate-900">{item.funcionario_nome}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-slate-100 px-2.5 py-1 rounded-full text-sm font-medium text-slate-700">
                                        {getQtdFuncionarioNaAba(item)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                    {formatCurrency(getTotalFuncionarioNaAba(item))}
                                </td>
                                <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                    <TableActionButtons
                                        onView={() => handleOpenView(item)}
                                        onEdit={() => handleOpenView(item)}
                                        onDelete={() => handleDeleteFuncionario(item)}
                                    />
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
                        Nenhum lançamento encontrado para esta competência.
                    </div>
                )}
                {filteredItems.map(item => (
                    <div
                        key={item.funcionario_id}
                        onClick={() => handleOpenView(item)}
                        className={clsx(
                            "bg-white p-4 rounded-lg shadow-sm border-l-4 space-y-3 cursor-pointer",
                            getBorderColor(empresas.find(e => e.id === item.funcionario_empresa_id)?.nome_empresa)
                        )}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-900">{item.funcionario_nome}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{getQtdFuncionarioNaAba(item)} lançamento(s)</p>
                            </div>
                            <span className="font-bold text-emerald-600">{formatCurrency(getTotalFuncionarioNaAba(item))}</span>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-slate-100" onClick={e => e.stopPropagation()}>
                            <TableActionButtons
                                onView={() => handleOpenView(item)}
                                onEdit={() => handleOpenView(item)}
                                onDelete={() => handleDeleteFuncionario(item)}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Visualização de Lançamentos do Funcionário */}
            {isViewModalOpen && selectedFuncionario && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">
                                Lançamentos - {selectedFuncionario.funcionario_nome}
                            </h3>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto p-6 space-y-6">
                            {/* Resumo */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1 flex items-center gap-2">
                                    <Users size={14} /> Informações Gerais
                                </h4>
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-medium">Funcionário</p>
                                            <p className="font-semibold text-slate-900">{selectedFuncionario.funcionario_nome}</p>
                                        </div>
                                        {Object.values(selectedFuncionario.totaisPorEmpresa).map(empTotal => (
                                            <div key={empTotal.empresa_id}>
                                                <p className="text-xs text-slate-500 uppercase font-medium">{empTotal.nome_empresa}</p>
                                                <p className="font-bold text-emerald-600">{formatCurrency(empTotal.total)}</p>
                                            </div>
                                        ))}
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-medium">Total Geral</p>
                                            <p className="font-bold text-blue-600 text-lg">{formatCurrency(selectedFuncionario.total)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lista de Lançamentos */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1 flex items-center gap-2">
                                        <Calendar size={14} /> Lançamentos
                                    </h4>
                                    <button
                                        onClick={() => handleOpenNovoLancamento(selectedFuncionario)}
                                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        <Plus size={16} /> Adicionar
                                    </button>
                                </div>

                                {/* Tabela Desktop */}
                                <div className="overflow-x-auto hidden md:block">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 text-slate-600 font-medium text-xs uppercase">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Data</th>
                                                <th className="px-3 py-2 text-left">Posto</th>
                                                <th className="px-3 py-2 text-left">Cargo</th>
                                                <th className="px-3 py-2 text-center">Duração</th>
                                                <th className="px-3 py-2 text-right">Valor</th>
                                                <th className="px-3 py-2 text-left">Empresa</th>
                                                <th className="px-3 py-2 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {selectedFuncionario.lancamentos
                                                .sort((a, b) => new Date(a.data_entrada) - new Date(b.data_entrada))
                                                .map(lanc => (
                                                    <tr key={lanc.id} className="hover:bg-slate-50">
                                                        <td className="px-3 py-2 text-slate-900">
                                                            {formatDate(lanc.data_entrada)}
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-700">
                                                            {lanc.contratos?.posto_trabalho || 'N/A'}
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-700">
                                                            {lanc.cargos_salarios?.cargo} - {lanc.cargos_salarios?.uf}
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-slate-600">
                                                            {formatDuracao(lanc.duracao_horas)}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-bold text-emerald-600">
                                                            {formatCurrency(lanc.valor_total)}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <CompanyBadge nomeEmpresa={lanc.empresas?.nome_empresa} />
                                                        </td>
                                                        <td className="px-3 py-2 text-right">
                                                            <TableActionButtons
                                                                onEdit={() => handleOpenEditLancamento(lanc)}
                                                                onDelete={() => handleDeleteLancamento(lanc)}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Cards Mobile */}
                                <div className="md:hidden space-y-3">
                                    {selectedFuncionario.lancamentos
                                        .sort((a, b) => new Date(a.data_entrada) - new Date(b.data_entrada))
                                        .map(lanc => (
                                            <div key={lanc.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {formatDate(lanc.data_entrada)} • {formatDuracao(lanc.duracao_horas)}
                                                        </p>
                                                        <p className="text-sm text-slate-500 mt-0.5">
                                                            {lanc.contratos?.posto_trabalho || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleOpenEditLancamento(lanc)}
                                                            className="text-slate-400 hover:text-blue-600 p-1"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteLancamento(lanc)}
                                                            className="text-slate-400 hover:text-red-600 p-1"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-500">
                                                            {lanc.cargos_salarios?.cargo} - {lanc.cargos_salarios?.uf}
                                                        </span>
                                                        <CompanyBadge nomeEmpresa={lanc.empresas?.nome_empresa} />
                                                    </div>
                                                    <span className="font-bold text-emerald-600">
                                                        {formatCurrency(lanc.valor_total)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Lançamento (Criar/Editar) */}
            {isLancamentoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsLancamentoModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingLancamento ? 'Editar Lançamento' : 'Novo Lançamento'}
                            </h3>
                            <button onClick={() => setIsLancamentoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmitLancamento)} className="overflow-y-auto p-6 space-y-4">
                            {/* Empresa */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Empresa *</label>
                                <select
                                    {...register('empresa_id')}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Selecione...</option>
                                    {empresas.filter(e => e.ativo !== false).map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.nome_empresa}</option>
                                    ))}
                                </select>
                                {errors.empresa_id && <span className="text-xs text-red-500">{errors.empresa_id.message}</span>}
                            </div>

                            {/* Posto de Trabalho */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Posto de Trabalho *</label>
                                <select
                                    {...register('contrato_id')}
                                    disabled={!watchEmpresa}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                >
                                    <option value="">Selecione...</option>
                                    {contratosFiltrados.map(cont => (
                                        <option key={cont.id} value={cont.id}>{cont.posto_trabalho}</option>
                                    ))}
                                </select>
                                {errors.contrato_id && <span className="text-xs text-red-500">{errors.contrato_id.message}</span>}
                            </div>

                            {/* Data/Hora Entrada e Saída */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Entrada *</label>
                                    <input
                                        type="datetime-local"
                                        {...register('data_entrada')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.data_entrada && <span className="text-xs text-red-500">{errors.data_entrada.message}</span>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Saída *</label>
                                    <input
                                        type="datetime-local"
                                        {...register('data_saida')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.data_saida && <span className="text-xs text-red-500">{errors.data_saida.message}</span>}
                                </div>
                            </div>

                            {/* Funcionário */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Funcionário *</label>
                                <select
                                    {...register('funcionario_id')}
                                    disabled={!watchEmpresa}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                >
                                    <option value="">Selecione...</option>
                                    {funcionariosFiltrados.map(func => (
                                        <option key={func.id} value={func.id}>{func.nome}</option>
                                    ))}
                                </select>
                                {errors.funcionario_id && <span className="text-xs text-red-500">{errors.funcionario_id.message}</span>}
                            </div>

                            {/* Cargo/UF e Turno */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Cargo *</label>
                                    <select
                                        {...register('cargo_id')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Selecione...</option>
                                        {cargos.map(cargo => (
                                            <option key={cargo.id} value={cargo.id}>
                                                {cargo.cargo} - {cargo.uf || 'N/A'}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.cargo_id && <span className="text-xs text-red-500">{errors.cargo_id.message}</span>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Turno *</label>
                                    <select
                                        {...register('turno')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Diurno">Diurno</option>
                                        <option value="Noturno">Noturno</option>
                                    </select>
                                    {errors.turno && <span className="text-xs text-red-500">{errors.turno.message}</span>}
                                </div>
                            </div>

                            {/* Valores Calculados */}
                            {valorCalculado.duracao > 0 && (
                                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 space-y-2">
                                    <div className="grid grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase">Diária</p>
                                            <p className="font-bold text-slate-700">{formatCurrency(valorCalculado.valorDiaria)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase">Valor/Hora</p>
                                            <p className="font-bold text-slate-700">{formatCurrency(valorCalculado.valorHora)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase">Duração</p>
                                            <p className="font-bold text-slate-700">{formatDuracao(valorCalculado.duracao)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-emerald-600 uppercase font-medium">Valor Total</p>
                                            <p className="text-xl font-bold text-emerald-600">{formatCurrency(valorCalculado.valorTotal)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Observações */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Observações</label>
                                <textarea
                                    {...register('observacoes')}
                                    rows={2}
                                    placeholder="Opcional"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsLancamentoModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                onClick={handleSubmit(onSubmitLancamento)}
                                disabled={actionLoading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Salvando...' : editingLancamento ? 'Salvar Alterações' : 'Criar Lançamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={confirmActionHandler}
                title={confirmAction?.type === 'deleteFuncionario' ? 'Excluir Todos os Lançamentos' : 'Excluir Lançamento'}
                message={
                    confirmAction?.type === 'deleteFuncionario'
                        ? 'Ao excluir, todos os lançamentos deste funcionário na competência serão removidos. Deseja continuar?'
                        : 'Tem certeza que deseja excluir este lançamento?'
                }
                confirmLabel="Excluir"
                confirmColor="red"
            />
        </div>
    );
}
