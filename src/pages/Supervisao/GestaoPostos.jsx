import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Users, UserPlus, Building2, X, Edit2, Trash2 } from 'lucide-react';
import clsx from 'clsx';

// --- SERVIÇOS & UTILS ---
import { useToast } from '../../components/ui/Toast';
import { gestaoPostosService } from '../../services/gestaoPostosService';
import { empresasService } from '../../services/empresasService';
import { funcionariosService } from '../../services/funcionariosService';
import { getBorderColor } from '../../utils/styles';

// --- COMPONENTES UI ---
import CompanyTabs from '../../components/ui/CompanyTabs';
import CompanyBadge from '../../components/ui/CompanyBadge';
import TableActionButtons from '../../components/ui/TableActionButtons';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

// --- CONSTANTES ---
const TIPOS_LOTACAO = [
    { value: 'Oficial', label: 'Lotação Oficial' },
    { value: 'Temporaria', label: 'Lotação Temporária' },
    { value: 'ServicoExtra', label: 'Serviço Extra' }
];

const ESCALAS = [
    { value: '12x36', label: '12x36' },
    { value: '5x1', label: '5x1' },
    { value: '6x2', label: '6x2' },
    { value: 'Outra', label: 'Outra' }
];

const TURNOS = [
    { value: 'Diurno', label: 'Diurno' },
    { value: 'Noturno', label: 'Noturno' }
];

// --- SCHEMAS ---
const funcionarioLotacaoSchema = z.object({
    funcionario_id: z.string().min(1, 'Selecione o funcionário'),
    tipo_lotacao: z.string().min(1, 'Selecione o tipo de lotação'),
    escala: z.string().min(1, 'Selecione a escala'),
    turno: z.string().min(1, 'Selecione o turno')
});

// --- KPI CARD ---
const MetricCard = ({ title, value, icon: Icon, type = "default" }) => {
    const bgColors = {
        blue: "bg-blue-50 border-blue-200",
        emerald: "bg-emerald-50 border-emerald-200",
        amber: "bg-amber-50 border-amber-200",
        default: "bg-white border-slate-200"
    };
    const iconColors = {
        blue: "text-blue-600 bg-blue-100",
        emerald: "text-emerald-600 bg-emerald-100",
        amber: "text-amber-600 bg-amber-100",
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

// --- TIPO LOTACAO BADGE ---
const TipoLotacaoBadge = ({ tipo }) => {
    const styles = {
        'Oficial': 'bg-emerald-100 text-emerald-800 border-emerald-200',
        'Temporaria': 'bg-amber-100 text-amber-800 border-amber-200',
        'ServicoExtra': 'bg-red-100 text-red-800 border-red-200'
    };
    const labels = {
        'Oficial': 'Lotação Oficial',
        'Temporaria': 'Lotação Temporária',
        'ServicoExtra': 'Serviço Extra'
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[tipo] || 'bg-slate-100 text-slate-700'}`}>
            {labels[tipo] || tipo}
        </span>
    );
};

export default function GestaoPostos() {
    const { addToast } = useToast();

    // States
    const [postos, setPostos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [activeCompany, setActiveCompany] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isAddPostoModalOpen, setIsAddPostoModalOpen] = useState(false);
    const [isEditPostoModalOpen, setIsEditPostoModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isAddFuncModalOpen, setIsAddFuncModalOpen] = useState(false);
    const [isEditFuncModalOpen, setIsEditFuncModalOpen] = useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);

    // Selected data
    const [selectedPosto, setSelectedPosto] = useState(null);
    const [postoFuncionarios, setPostoFuncionarios] = useState([]);
    const [editingFuncionario, setEditingFuncionario] = useState(null);

    // Add Posto state
    const [selectedEmpresaForAdd, setSelectedEmpresaForAdd] = useState('');
    const [postosDisponiveis, setPostosDisponiveis] = useState([]);
    const [selectedContratoId, setSelectedContratoId] = useState('');
    const [addingPosto, setAddingPosto] = useState(false);

    // Form for funcionário
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(funcionarioLotacaoSchema)
    });

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            setLoading(true);

            // Carregar empresas e funcionários independentemente (sempre funcionam)
            const [empresasData, funcsData] = await Promise.all([
                empresasService.getAll(),
                funcionariosService.getAll()
            ]);
            setEmpresas(empresasData || []);
            setFuncionarios(funcsData || []);

            // Carregar postos da gestão (pode falhar se tabela não existir)
            try {
                const postosData = await gestaoPostosService.getAll(activeCompany === 'all' ? null : activeCompany);
                setPostos(postosData || []);
            } catch (postoError) {
                console.warn('Tabela gestao_postos não encontrada. Execute a migração SQL.', postoError);
                setPostos([]);
            }
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: 'Falha ao carregar dados.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeCompany]);

    // --- HANDLERS ---
    const handleOpenAddPosto = async () => {
        setSelectedEmpresaForAdd('');
        setSelectedContratoId('');
        setPostosDisponiveis([]);
        setIsAddPostoModalOpen(true);
    };

    const handleEmpresaChangeForAdd = async (empresaId) => {
        setSelectedEmpresaForAdd(empresaId);
        setSelectedContratoId('');
        if (empresaId) {
            const disponiveis = await gestaoPostosService.getPostosDisponiveis(empresaId);
            setPostosDisponiveis(disponiveis);
        } else {
            setPostosDisponiveis([]);
        }
    };

    const handleOpenEditPosto = (posto) => {
        setSelectedPosto(posto);
        setIsViewModalOpen(false);
        setIsEditPostoModalOpen(true);
    };

    const handleConfirmAddPosto = async () => {
        if (!selectedContratoId) {
            addToast({ type: 'warning', title: 'Atenção', message: 'Selecione um posto.' });
            return;
        }
        try {
            setAddingPosto(true);
            await gestaoPostosService.addPosto(selectedContratoId);
            addToast({ type: 'success', title: 'Sucesso', message: 'Posto adicionado à gestão.' });
            setIsAddPostoModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao adicionar posto.' });
        } finally {
            setAddingPosto(false);
        }
    };

    const handleOpenView = async (posto) => {
        setSelectedPosto(posto);
        try {
            const funcs = await gestaoPostosService.getFuncionariosByPosto(posto.id);
            setPostoFuncionarios(funcs);
        } catch (error) {
            console.error(error);
            setPostoFuncionarios([]);
        }
        setIsViewModalOpen(true);
    };

    const handleOpenAddFunc = (posto = null) => {
        if (posto) {
            setSelectedPosto(posto);
        }
        reset({
            funcionario_id: '',
            tipo_lotacao: '',
            escala: '',
            turno: ''
        });
        setIsAddFuncModalOpen(true);
    };

    const handleOpenEditFunc = (func) => {
        setEditingFuncionario(func);
        reset({
            funcionario_id: func.funcionario_id,
            tipo_lotacao: func.tipo_lotacao,
            escala: func.escala,
            turno: func.turno
        });
        setIsEditFuncModalOpen(true);
    };

    const onSubmitAddFunc = async (data) => {
        try {
            await gestaoPostosService.addFuncionario({
                ...data,
                gestao_posto_id: selectedPosto.id
            });
            addToast({ type: 'success', title: 'Sucesso', message: 'Funcionário adicionado.' });
            setIsAddFuncModalOpen(false);
            // Refresh view modal
            const funcs = await gestaoPostosService.getFuncionariosByPosto(selectedPosto.id);
            setPostoFuncionarios(funcs);
            fetchData();
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: error.message || 'Erro ao adicionar funcionário.' });
        }
    };

    const onSubmitEditFunc = async (data) => {
        try {
            await gestaoPostosService.updateFuncionario(editingFuncionario.id, data);
            addToast({ type: 'success', title: 'Sucesso', message: 'Funcionário atualizado.' });
            setIsEditFuncModalOpen(false);
            // Refresh view modal
            const funcs = await gestaoPostosService.getFuncionariosByPosto(selectedPosto.id);
            setPostoFuncionarios(funcs);
            fetchData();
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: error.message || 'Erro ao atualizar funcionário.' });
        }
    };

    const handleDeleteClick = (type, item) => {
        setConfirmAction({ type, item });
        setConfirmModalOpen(true);
    };

    const confirmActionHandler = async () => {
        if (!confirmAction) return;
        const { type, item } = confirmAction;
        try {
            if (type === 'deletePosto') {
                await gestaoPostosService.deletePosto(item.id);
                addToast({ type: 'success', title: 'Excluído', message: 'Posto removido da gestão.' });
                setIsViewModalOpen(false);
            } else if (type === 'deleteFuncionario') {
                await gestaoPostosService.deleteFuncionario(item.id);
                addToast({ type: 'success', title: 'Excluído', message: 'Funcionário removido.' });
                // Refresh view modal
                if (selectedPosto) {
                    const funcs = await gestaoPostosService.getFuncionariosByPosto(selectedPosto.id);
                    setPostoFuncionarios(funcs);
                }
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
    const filteredItems = postos.filter(item => {
        const matchesSearch =
            item.contratos?.posto_trabalho?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.contratos?.empresas?.nome_empresa?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // --- KPIS ---
    const kpiTotal = filteredItems.length;
    const kpiByCompany = empresas.filter(e => e.ativo).map(emp => ({
        id: emp.id,
        nome: emp.nome_empresa,
        count: filteredItems.filter(p => p.contratos?.empresa_id === emp.id).length
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestão de Postos</h1>
                    <p className="text-slate-500">Gerenciamento de lotação de funcionários nos postos de trabalho</p>
                </div>
                <button
                    onClick={handleOpenAddPosto}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full md:w-auto justify-center"
                >
                    <Plus className="h-5 w-5" />
                    Adicionar Posto
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard title="Total de Postos" value={kpiTotal} icon={Building2} type="blue" />
                {kpiByCompany.slice(0, 3).map(emp => (
                    <MetricCard key={emp.id} title={emp.nome} value={emp.count} icon={Users} type="default" />
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por posto ou empresa..."
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
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Posto</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Empresa</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Oficial</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Temporária</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Serv. Extra</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {loading ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-500">Carregando...</td></tr>
                        ) : filteredItems.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-500">Nenhum posto encontrado</td></tr>
                        ) : (
                            filteredItems.map(item => (
                                <tr
                                    key={item.id}
                                    onClick={() => handleOpenView(item)}
                                    className={clsx("hover:bg-slate-50 transition-colors cursor-pointer border-l-4", getBorderColor(item.contratos?.empresas?.nome_empresa))}
                                >
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-slate-900">{item.contratos?.posto_trabalho || 'N/A'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <CompanyBadge nomeEmpresa={item.contratos?.empresas?.nome_empresa} />
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-bold text-emerald-600">{item.qtd_oficial}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-bold text-amber-600">{item.qtd_temporaria}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-bold text-red-600">{item.qtd_servico_extra}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => handleOpenAddFunc(item)} title="Adicionar Funcionário" className="p-1.5 hover:bg-slate-100 rounded text-blue-600">
                                                <UserPlus size={18} />
                                            </button>
                                            <TableActionButtons
                                                onView={() => handleOpenView(item)}
                                                onEdit={() => handleOpenEditPosto(item)}
                                                onDelete={() => handleDeleteClick('deletePosto', item)}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {loading ? (
                    <div className="bg-white p-8 rounded-lg text-center text-slate-500">Carregando...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg text-center text-slate-500">Nenhum posto encontrado</div>
                ) : (
                    filteredItems.map(item => (
                        <div
                            key={item.id}
                            onClick={() => handleOpenView(item)}
                            className={clsx(
                                "bg-white p-4 rounded-lg shadow-sm border-l-4 space-y-3 cursor-pointer",
                                getBorderColor(item.contratos?.empresas?.nome_empresa)
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-slate-900">{item.contratos?.posto_trabalho || 'N/A'}</h3>
                                    <CompanyBadge nomeEmpresa={item.contratos?.empresas?.nome_empresa} />
                                </div>
                            </div>
                            <div className="flex gap-4 text-sm">
                                <div className="text-center">
                                    <p className="text-xs text-slate-500">Oficial</p>
                                    <span className="font-bold text-emerald-600">{item.qtd_oficial}</span>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-slate-500">Temporária</p>
                                    <span className="font-bold text-amber-600">{item.qtd_temporaria}</span>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-slate-500">Serv. Extra</p>
                                    <span className="font-bold text-red-600">{item.qtd_servico_extra}</span>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => handleOpenAddFunc(item)} className="p-1.5 hover:bg-slate-100 rounded text-blue-600">
                                    <UserPlus size={18} />
                                </button>
                                <TableActionButtons
                                    onView={() => handleOpenView(item)}
                                    onEdit={() => handleOpenEditPosto(item)}
                                    onDelete={() => handleDeleteClick('deletePosto', item)}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal: Adicionar Posto */}
            {isAddPostoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddPostoModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">Adicionar Posto</h3>
                            <button onClick={() => setIsAddPostoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Empresa *</label>
                                <select
                                    value={selectedEmpresaForAdd}
                                    onChange={(e) => handleEmpresaChangeForAdd(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">Selecione a empresa...</option>
                                    {empresas.filter(e => e.ativo).map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.nome_empresa}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Posto de Trabalho *</label>
                                <select
                                    value={selectedContratoId}
                                    onChange={(e) => setSelectedContratoId(e.target.value)}
                                    disabled={!selectedEmpresaForAdd}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                >
                                    <option value="">Selecione o posto...</option>
                                    {postosDisponiveis.map(c => (
                                        <option key={c.id} value={c.id}>{c.posto_trabalho}</option>
                                    ))}
                                </select>
                                {selectedEmpresaForAdd && postosDisponiveis.length === 0 && (
                                    <p className="text-xs text-amber-600">Nenhum posto disponível para esta empresa.</p>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsAddPostoModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                                Cancelar
                            </button>
                            <button onClick={handleConfirmAddPosto} disabled={addingPosto || !selectedContratoId} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                {addingPosto ? 'Adicionando...' : 'Adicionar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Editar Posto */}
            {isEditPostoModalOpen && selectedPosto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditPostoModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">Editar Posto</h3>
                            <button onClick={() => setIsEditPostoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-medium">Empresa</p>
                                        <CompanyBadge nomeEmpresa={selectedPosto.contratos?.empresas?.nome_empresa} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-medium">Posto Atual</p>
                                        <p className="font-semibold text-slate-900">{selectedPosto.contratos?.posto_trabalho || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                                <p className="text-sm text-amber-700">Para alterar o posto vinculado, exclua este registro e adicione um novo posto com o contrato desejado.</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between gap-3">
                            <button
                                onClick={() => {
                                    setIsEditPostoModalOpen(false);
                                    handleDeleteClick('deletePosto', selectedPosto);
                                }}
                                className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                            >
                                Excluir Posto
                            </button>
                            <div className="flex gap-3">
                                <button onClick={() => setIsEditPostoModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                                    Fechar
                                </button>
                                <button onClick={() => { setIsEditPostoModalOpen(false); handleOpenView(selectedPosto); }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                                    Ver Detalhes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Visualizar Posto */}
            {isViewModalOpen && selectedPosto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                            <h3 className="text-lg font-bold text-slate-900">Informações do Posto</h3>
                            <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6 space-y-6">
                            {/* Dados do Posto */}
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-medium">Empresa</p>
                                        <CompanyBadge nomeEmpresa={selectedPosto.contratos?.empresas?.nome_empresa} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase font-medium">Posto de Trabalho</p>
                                        <p className="font-semibold text-slate-900">{selectedPosto.contratos?.posto_trabalho || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Funcionários */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Funcionários Relacionados</h4>
                                    <button onClick={() => handleOpenAddFunc()} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                                        <UserPlus size={16} />
                                        Adicionar
                                    </button>
                                </div>
                                {postoFuncionarios.length === 0 ? (
                                    <div className="text-center py-6 text-slate-500">Nenhum funcionário vinculado a este posto.</div>
                                ) : (
                                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                                        {postoFuncionarios.map(func => (
                                            <div key={func.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-900">{func.funcionarios?.nome || 'N/A'}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-slate-500">{func.escala} ({func.turno})</span>
                                                        <TipoLotacaoBadge tipo={func.tipo_lotacao} />
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleOpenEditFunc(func)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick('deleteFuncionario', func)} className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-red-600">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                            <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                                Fechar
                            </button>
                            <button onClick={() => handleOpenEditPosto(selectedPosto)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                                Editar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Adicionar Funcionário */}
            {isAddFuncModalOpen && selectedPosto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddFuncModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">Adicionar Funcionário</h3>
                            <button onClick={() => setIsAddFuncModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmitAddFunc)} className="p-6 space-y-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                                <p className="text-xs text-slate-500">Posto</p>
                                <p className="font-semibold text-slate-900">{selectedPosto.contratos?.posto_trabalho}</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Tipo de Lotação *</label>
                                <select {...register('tipo_lotacao')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                                    <option value="">Selecione...</option>
                                    {TIPOS_LOTACAO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                {errors.tipo_lotacao && <span className="text-xs text-red-500">{errors.tipo_lotacao.message}</span>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Funcionário *</label>
                                <select {...register('funcionario_id')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                                    <option value="">Selecione...</option>
                                    {funcionarios.filter(f => f.ativo).map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                                </select>
                                {errors.funcionario_id && <span className="text-xs text-red-500">{errors.funcionario_id.message}</span>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Escala *</label>
                                    <select {...register('escala')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                                        <option value="">Selecione...</option>
                                        {ESCALAS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                                    </select>
                                    {errors.escala && <span className="text-xs text-red-500">{errors.escala.message}</span>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Turno *</label>
                                    <select {...register('turno')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                                        <option value="">Selecione...</option>
                                        {TURNOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                    {errors.turno && <span className="text-xs text-red-500">{errors.turno.message}</span>}
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsAddFuncModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {isSubmitting ? 'Salvando...' : 'Adicionar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Editar Funcionário */}
            {isEditFuncModalOpen && editingFuncionario && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditFuncModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">Editar Funcionário</h3>
                            <button onClick={() => setIsEditFuncModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmitEditFunc)} className="p-6 space-y-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                                <p className="text-xs text-slate-500">Funcionário</p>
                                <p className="font-semibold text-slate-900">{editingFuncionario.funcionarios?.nome}</p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Tipo de Lotação *</label>
                                <select {...register('tipo_lotacao')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                                    <option value="">Selecione...</option>
                                    {TIPOS_LOTACAO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                                {errors.tipo_lotacao && <span className="text-xs text-red-500">{errors.tipo_lotacao.message}</span>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Escala *</label>
                                    <select {...register('escala')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                                        <option value="">Selecione...</option>
                                        {ESCALAS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                                    </select>
                                    {errors.escala && <span className="text-xs text-red-500">{errors.escala.message}</span>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Turno *</label>
                                    <select {...register('turno')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white">
                                        <option value="">Selecione...</option>
                                        {TURNOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                    {errors.turno && <span className="text-xs text-red-500">{errors.turno.message}</span>}
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsEditFuncModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {isSubmitting ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModalOpen}
                title={confirmAction?.type === 'deletePosto' ? "Excluir Posto" : "Excluir Funcionário"}
                message={confirmAction?.type === 'deletePosto'
                    ? "Ao excluir o posto, todos os funcionários vinculados serão removidos. Deseja continuar?"
                    : "Tem certeza que deseja remover este funcionário do posto?"}
                onConfirm={confirmActionHandler}
                onCancel={() => setConfirmModalOpen(false)}
            />
        </div>
    );
}
