import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Shield, Crosshair, Package, ArrowRightLeft, RotateCcw, Search } from 'lucide-react';
import clsx from 'clsx';

// --- SERVIÇOS & UTILS ---
import { useToast } from '../../components/ui/Toast';
import { equipamentosService } from '../../services/equipamentosService';
import { getBorderColor } from '../../utils/styles';

// --- COMPONENTES UI ---
import StatusBadge from '../../components/ui/StatusBadge';
import TableActionButtons from '../../components/ui/TableActionButtons';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

// --- CATEGORIAS ---
const CATEGORIAS = [
    { value: 'Armamento', label: 'Armamentos', icon: Crosshair, color: 'red' },
    { value: 'Colete', label: 'Coletes Balísticos', icon: Shield, color: 'blue' },
    { value: 'Munição', label: 'Munições', icon: Package, color: 'amber' }
];

// --- SCHEMAS ---
const equipamentoSchema = z.object({
    categoria: z.string().min(1, 'Categoria obrigatória'),
    descricao: z.string().min(3, 'Descrição obrigatória'),
    identificacao: z.string().optional(),
    quantidade: z.coerce.number().min(1, 'Mínimo 1').default(1)
});

const destinarSchema = z.object({
    equipamento_id: z.string().min(1, 'Selecione o equipamento'),
    contrato_id: z.string().min(1, 'Selecione o posto'),
    quantidade: z.coerce.number().min(1, 'Mínimo 1')
});

const devolverSchema = z.object({
    distribuicao_id: z.string().min(1, 'Selecione a distribuição'),
    quantidade: z.coerce.number().min(1, 'Mínimo 1')
});

// --- KPI CARD ---
const MetricCard = ({ title, emEstoque, emUso, total, icon: Icon, color }) => {
    const colors = {
        red: { bg: 'bg-red-50 border-red-200', icon: 'bg-red-100 text-red-600' },
        blue: { bg: 'bg-blue-50 border-blue-200', icon: 'bg-blue-100 text-blue-600' },
        amber: { bg: 'bg-amber-50 border-amber-200', icon: 'bg-amber-100 text-amber-600' }
    };
    const c = colors[color] || colors.blue;

    return (
        <div className={`p-4 rounded-xl border shadow-sm ${c.bg}`}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${c.icon}`}>
                    <Icon size={20} />
                </div>
                <h3 className="font-bold text-slate-800">{title}</h3>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                    <p className="text-xs text-slate-500">Estoque</p>
                    <p className="text-lg font-bold text-emerald-600">{emEstoque}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500">Em Uso</p>
                    <p className="text-lg font-bold text-amber-600">{emUso}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-lg font-bold text-slate-700">{total}</p>
                </div>
            </div>
        </div>
    );
};

export default function EquipamentosControlados() {
    const { addToast } = useToast();

    // Data
    const [equipamentos, setEquipamentos] = useState([]);
    const [distribuicao, setDistribuicao] = useState([]);
    const [postosFemog, setPostosFemog] = useState([]);
    const [stats, setStats] = useState({ armamentos: {}, coletes: {}, municoes: {} });
    const [loading, setLoading] = useState(true);

    // Tabs & Filters
    const [activeTab, setActiveTab] = useState('estoque'); // 'estoque' | 'postos'
    const [categoriaFilter, setCategoriaFilter] = useState('');
    const [postoFilter, setPostoFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
    const [isDestinarModalOpen, setIsDestinarModalOpen] = useState(false);
    const [isDevolverModalOpen, setIsDevolverModalOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [editingEquip, setEditingEquip] = useState(null);

    // Delete
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Forms
    const equipForm = useForm({ resolver: zodResolver(equipamentoSchema), defaultValues: { quantidade: 1 } });
    const destinarForm = useForm({ resolver: zodResolver(destinarSchema), defaultValues: { quantidade: 1 } });
    const devolverForm = useForm({ resolver: zodResolver(devolverSchema), defaultValues: { quantidade: 1 } });

    const categoriaWatch = equipForm.watch('categoria');
    const destinarEquipIdWatch = destinarForm.watch('equipamento_id');
    const devolverDistIdWatch = devolverForm.watch('distribuicao_id');

    // Calcula se quantidade deve ser travada em 1 (armamentos e coletes)
    const destinarEquipSelecionado = equipamentos.find(e => e.id === destinarEquipIdWatch);
    const destinarIsMunicao = destinarEquipSelecionado?.categoria === 'Munição';

    const devolverDistSelecionada = distribuicao.find(d => d.id === devolverDistIdWatch);
    const devolverIsMunicao = devolverDistSelecionada?.equipamentos?.categoria === 'Munição';

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const [equips, dist, postos, statsData] = await Promise.all([
                equipamentosService.getAll(),
                equipamentosService.getDistribuicao(),
                equipamentosService.getPostosFemog(),
                equipamentosService.getStats()
            ]);
            setEquipamentos(equips);
            setDistribuicao(dist);
            setPostosFemog(postos);
            setStats(statsData);
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao carregar dados.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- HANDLERS: EQUIPAMENTO ---
    const handleAddNew = () => {
        setEditingEquip(null);
        setIsViewMode(false);
        equipForm.reset({ categoria: '', descricao: '', identificacao: '', quantidade: 1 });
        setIsEquipModalOpen(true);
    };

    const handleEdit = (equip) => {
        setEditingEquip(equip);
        setIsViewMode(false);
        equipForm.reset({
            categoria: equip.categoria,
            descricao: equip.descricao,
            identificacao: equip.identificacao || '',
            quantidade: equip.quantidade
        });
        setIsEquipModalOpen(true);
    };

    const handleView = (equip) => {
        handleEdit(equip);
        setIsViewMode(true);
    };

    const handleDeleteClick = (equip) => {
        setItemToDelete(equip);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await equipamentosService.delete(itemToDelete.id);
            addToast({ type: 'success', title: 'Sucesso', message: 'Equipamento excluído.' });
            fetchData();
        } catch (error) {
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao excluir.' });
        } finally {
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const onSubmitEquip = async (data) => {
        try {
            // Para armamentos e coletes, quantidade é sempre 1
            if (data.categoria !== 'Munição') {
                data.quantidade = 1;
            }

            if (editingEquip) {
                await equipamentosService.update(editingEquip.id, data);
                addToast({ type: 'success', title: 'Sucesso', message: 'Equipamento atualizado.' });
            } else {
                await equipamentosService.create(data);
                addToast({ type: 'success', title: 'Sucesso', message: 'Equipamento cadastrado.' });
            }
            setIsEquipModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: error.message || 'Erro ao salvar.' });
        }
    };

    // --- HANDLERS: DESTINAR ---
    const handleOpenDestinar = () => {
        destinarForm.reset({ equipamento_id: '', contrato_id: '', quantidade: 1 });
        setIsDestinarModalOpen(true);
    };

    const onSubmitDestinar = async (data) => {
        try {
            // Força quantidade = 1 para armamentos e coletes
            const equip = equipamentos.find(e => e.id === data.equipamento_id);
            const qtd = equip?.categoria === 'Munição' ? data.quantidade : 1;

            await equipamentosService.destinar(data.equipamento_id, data.contrato_id, qtd);
            addToast({ type: 'success', title: 'Sucesso', message: 'Equipamento destinado ao posto.' });
            setIsDestinarModalOpen(false);
            fetchData();
        } catch (error) {
            addToast({ type: 'error', title: 'Erro', message: error.message || 'Erro ao destinar.' });
        }
    };

    // --- HANDLERS: DEVOLVER ---
    const handleOpenDevolver = () => {
        devolverForm.reset({ distribuicao_id: '', quantidade: 1 });
        setIsDevolverModalOpen(true);
    };

    const onSubmitDevolver = async (data) => {
        try {
            // Força quantidade = 1 para armamentos e coletes
            const dist = distribuicao.find(d => d.id === data.distribuicao_id);
            const qtd = dist?.equipamentos?.categoria === 'Munição' ? data.quantidade : 1;

            await equipamentosService.devolver(data.distribuicao_id, qtd);
            addToast({ type: 'success', title: 'Sucesso', message: 'Equipamento devolvido ao estoque.' });
            setIsDevolverModalOpen(false);
            fetchData();
        } catch (error) {
            addToast({ type: 'error', title: 'Erro', message: error.message || 'Erro ao devolver.' });
        }
    };

    // --- FILTERS ---
    const filteredEquipamentos = equipamentos
        .filter(e => !categoriaFilter || e.categoria === categoriaFilter)
        .filter(e => e.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.identificacao || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const filteredDistribuicao = distribuicao
        .filter(d => !categoriaFilter || d.equipamentos?.categoria === categoriaFilter)
        .filter(d => !postoFilter || d.contrato_id === postoFilter);

    // Lista única de postos da distribuição
    const postosComEquipamentos = [...new Map(distribuicao.map(d => [d.contrato_id, d.contratos])).values()];

    // --- HELPERS ---
    const getCategoriaInfo = (cat) => CATEGORIAS.find(c => c.value === cat) || CATEGORIAS[0];

    return (
        <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Equipamentos Controlados</h1>
                    <p className="text-slate-500">Gestão de armamentos, coletes e munições</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleAddNew}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Equipamento
                    </button>
                    <button
                        onClick={handleOpenDestinar}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <ArrowRightLeft className="h-5 w-5" />
                        Destinar
                    </button>
                    <button
                        onClick={handleOpenDevolver}
                        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <RotateCcw className="h-5 w-5" />
                        Devolver
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                    title="Armamentos"
                    emEstoque={stats.armamentos?.emEstoque || 0}
                    emUso={stats.armamentos?.emUso || 0}
                    total={stats.armamentos?.total || 0}
                    icon={Crosshair}
                    color="red"
                />
                <MetricCard
                    title="Coletes Balísticos"
                    emEstoque={stats.coletes?.emEstoque || 0}
                    emUso={stats.coletes?.emUso || 0}
                    total={stats.coletes?.total || 0}
                    icon={Shield}
                    color="blue"
                />
                <MetricCard
                    title="Munições"
                    emEstoque={stats.municoes?.emEstoque || 0}
                    emUso={stats.municoes?.emUso || 0}
                    total={stats.municoes?.total || 0}
                    icon={Package}
                    color="amber"
                />
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('estoque')}
                        className={clsx(
                            "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                            activeTab === 'estoque'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        )}
                    >
                        Estoque
                    </button>
                    <button
                        onClick={() => setActiveTab('postos')}
                        className={clsx(
                            "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                            activeTab === 'postos'
                                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        )}
                    >
                        Postos de Trabalho
                    </button>
                </div>

                {/* Filters */}
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar equipamento..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <select
                        value={categoriaFilter}
                        onChange={(e) => setCategoriaFilter(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option value="">Todas Categorias</option>
                        {CATEGORIAS.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                    {activeTab === 'postos' && (
                        <select
                            value={postoFilter}
                            onChange={(e) => setPostoFilter(e.target.value)}
                            className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="">Todos os Postos</option>
                            {postosComEquipamentos.map(p => (
                                <option key={p?.id} value={p?.id}>{p?.posto_trabalho}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Content */}
                {activeTab === 'estoque' ? (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 font-medium">
                                    <tr>
                                        <th className="px-6 py-3 uppercase text-xs font-semibold">Descrição</th>
                                        <th className="px-6 py-3 uppercase text-xs font-semibold">Identificação</th>
                                        <th className="px-6 py-3 uppercase text-xs font-semibold">Categoria</th>
                                        <th className="px-6 py-3 uppercase text-xs font-semibold text-center">Disponível</th>
                                        <th className="px-6 py-3 uppercase text-xs font-semibold text-center">Status</th>
                                        <th className="px-6 py-3 uppercase text-xs font-semibold text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {loading ? (
                                        <tr><td colSpan="6" className="p-8 text-center text-slate-500">Carregando...</td></tr>
                                    ) : filteredEquipamentos.length === 0 ? (
                                        <tr><td colSpan="6" className="p-8 text-center text-slate-500">Nenhum equipamento encontrado</td></tr>
                                    ) : (
                                        filteredEquipamentos.map(equip => {
                                            const catInfo = getCategoriaInfo(equip.categoria);
                                            return (
                                                <tr
                                                    key={equip.id}
                                                    onClick={() => handleView(equip)}
                                                    className={clsx(
                                                        "hover:bg-slate-50 transition-colors cursor-pointer border-l-4",
                                                        equip.categoria === 'Armamento' ? 'border-l-red-500' :
                                                            equip.categoria === 'Colete' ? 'border-l-blue-500' : 'border-l-amber-500'
                                                    )}
                                                >
                                                    <td className="px-6 py-4 font-medium text-slate-900">{equip.descricao}</td>
                                                    <td className="px-6 py-4 text-slate-600">{equip.identificacao || '-'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={clsx(
                                                            "px-2 py-1 rounded-full text-xs font-medium",
                                                            equip.categoria === 'Armamento' ? 'bg-red-100 text-red-700' :
                                                                equip.categoria === 'Colete' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                                        )}>
                                                            {catInfo.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={clsx(
                                                            "font-bold",
                                                            equip.quantidade_disponivel > 0 ? 'text-emerald-600' : 'text-red-600'
                                                        )}>
                                                            {equip.quantidade_disponivel} / {equip.quantidade}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <StatusBadge value={equip.ativo} />
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <TableActionButtons
                                                            onView={() => handleView(equip)}
                                                            onEdit={() => handleEdit(equip)}
                                                            onDelete={() => handleDeleteClick(equip)}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4 p-4">
                            {loading ? (
                                <p className="text-center text-slate-500 py-4">Carregando...</p>
                            ) : filteredEquipamentos.length === 0 ? (
                                <p className="text-center text-slate-500 py-4">Nenhum equipamento encontrado</p>
                            ) : (
                                filteredEquipamentos.map(equip => {
                                    const catInfo = getCategoriaInfo(equip.categoria);
                                    return (
                                        <div
                                            key={equip.id}
                                            onClick={() => handleView(equip)}
                                            className={clsx(
                                                "bg-white p-4 rounded-lg shadow-sm border-l-4 space-y-3 cursor-pointer",
                                                equip.categoria === 'Armamento' ? 'border-l-red-500' :
                                                    equip.categoria === 'Colete' ? 'border-l-blue-500' : 'border-l-amber-500'
                                            )}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{equip.descricao}</h3>
                                                    {equip.identificacao && (
                                                        <p className="text-xs text-slate-500 mt-0.5">ID: {equip.identificacao}</p>
                                                    )}
                                                    <span className={clsx(
                                                        "inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                                        equip.categoria === 'Armamento' ? 'bg-red-100 text-red-700' :
                                                            equip.categoria === 'Colete' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                                    )}>
                                                        {catInfo.label}
                                                    </span>
                                                </div>
                                                <StatusBadge value={equip.ativo} />
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                                <span className={clsx(
                                                    "font-bold",
                                                    equip.quantidade_disponivel > 0 ? 'text-emerald-600' : 'text-red-600'
                                                )}>
                                                    Disponível: {equip.quantidade_disponivel} / {equip.quantidade}
                                                </span>
                                                <TableActionButtons
                                                    onView={() => handleView(equip)}
                                                    onEdit={() => handleEdit(equip)}
                                                    onDelete={() => handleDeleteClick(equip)}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                ) : (
                    /* Aba Postos de Trabalho */
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-600 font-medium">
                                    <tr>
                                        <th className="px-6 py-3 uppercase text-xs font-semibold">Posto</th>
                                        <th className="px-6 py-3 uppercase text-xs font-semibold">Categoria</th>
                                        <th className="px-6 py-3 uppercase text-xs font-semibold">Equipamento</th>
                                        <th className="px-6 py-3 uppercase text-xs font-semibold">Identificação</th>
                                        <th className="px-6 py-3 uppercase text-xs font-semibold text-center">Quantidade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {loading ? (
                                        <tr><td colSpan="5" className="p-8 text-center text-slate-500">Carregando...</td></tr>
                                    ) : filteredDistribuicao.length === 0 ? (
                                        <tr><td colSpan="5" className="p-8 text-center text-slate-500">Nenhuma distribuição encontrada</td></tr>
                                    ) : (
                                        filteredDistribuicao.map(dist => {
                                            const catInfo = getCategoriaInfo(dist.equipamentos?.categoria);
                                            return (
                                                <tr
                                                    key={dist.id}
                                                    className={clsx(
                                                        "hover:bg-slate-50 transition-colors border-l-4",
                                                        getBorderColor(dist.contratos?.empresas?.nome_empresa)
                                                    )}
                                                >
                                                    <td className="px-6 py-4 font-medium text-slate-900">
                                                        {dist.contratos?.posto_trabalho}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={clsx(
                                                            "px-2 py-1 rounded-full text-xs font-medium",
                                                            dist.equipamentos?.categoria === 'Armamento' ? 'bg-red-100 text-red-700' :
                                                                dist.equipamentos?.categoria === 'Colete' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                                        )}>
                                                            {catInfo.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600">{dist.equipamentos?.descricao}</td>
                                                    <td className="px-6 py-4 text-slate-600">{dist.equipamentos?.identificacao || '-'}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-slate-700">{dist.quantidade}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4 p-4">
                            {loading ? (
                                <p className="text-center text-slate-500 py-4">Carregando...</p>
                            ) : filteredDistribuicao.length === 0 ? (
                                <p className="text-center text-slate-500 py-4">Nenhuma distribuição encontrada</p>
                            ) : (
                                filteredDistribuicao.map(dist => {
                                    const catInfo = getCategoriaInfo(dist.equipamentos?.categoria);
                                    return (
                                        <div
                                            key={dist.id}
                                            className={clsx(
                                                "bg-white p-4 rounded-lg shadow-sm border-l-4 space-y-2",
                                                getBorderColor(dist.contratos?.empresas?.nome_empresa)
                                            )}
                                        >
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-bold text-slate-900">{dist.contratos?.posto_trabalho}</h3>
                                                <span className="font-bold text-slate-700">Qtd: {dist.quantidade}</span>
                                            </div>
                                            <p className="text-sm text-slate-600">{dist.equipamentos?.descricao}</p>
                                            <div className="flex gap-2">
                                                <span className={clsx(
                                                    "px-2 py-0.5 rounded-full text-xs font-medium",
                                                    dist.equipamentos?.categoria === 'Armamento' ? 'bg-red-100 text-red-700' :
                                                        dist.equipamentos?.categoria === 'Colete' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                                )}>
                                                    {catInfo.label}
                                                </span>
                                                {dist.equipamentos?.identificacao && (
                                                    <span className="text-xs text-slate-500">ID: {dist.equipamentos.identificacao}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Modal: Novo/Editar Equipamento */}
            {isEquipModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEquipModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">
                                {isViewMode ? 'Detalhes do Equipamento' : editingEquip ? 'Editar Equipamento' : 'Novo Equipamento'}
                            </h3>
                            <button onClick={() => setIsEquipModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={equipForm.handleSubmit(onSubmitEquip)} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Categoria *</label>
                                <select
                                    {...equipForm.register('categoria')}
                                    disabled={isViewMode}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                >
                                    <option value="">Selecione...</option>
                                    {CATEGORIAS.map(c => (
                                        <option key={c.value} value={c.value}>{c.label}</option>
                                    ))}
                                </select>
                                {equipForm.formState.errors.categoria && <span className="text-xs text-red-500">{equipForm.formState.errors.categoria.message}</span>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Descrição *</label>
                                <input
                                    type="text"
                                    {...equipForm.register('descricao')}
                                    disabled={isViewMode}
                                    placeholder="Marca, modelo, calibre..."
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                />
                                {equipForm.formState.errors.descricao && <span className="text-xs text-red-500">{equipForm.formState.errors.descricao.message}</span>}
                            </div>

                            {categoriaWatch !== 'Munição' && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Identificação (Número de Série) *</label>
                                    <input
                                        type="text"
                                        {...equipForm.register('identificacao')}
                                        disabled={isViewMode}
                                        placeholder="Número único"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                    />
                                </div>
                            )}

                            {categoriaWatch === 'Munição' && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Quantidade *</label>
                                    <input
                                        type="number"
                                        {...equipForm.register('quantidade')}
                                        disabled={isViewMode}
                                        min="1"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                                    />
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEquipModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                                >
                                    {isViewMode ? 'Fechar' : 'Cancelar'}
                                </button>
                                {isViewMode ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsViewMode(false)}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                    >
                                        Editar
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={equipForm.formState.isSubmitting}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {equipForm.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Destinar */}
            {isDestinarModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDestinarModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50">
                            <h3 className="text-lg font-bold text-slate-900">Destinar Equipamento</h3>
                            <button onClick={() => setIsDestinarModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={destinarForm.handleSubmit(onSubmitDestinar)} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Equipamento *</label>
                                <select
                                    {...destinarForm.register('equipamento_id')}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Selecione...</option>
                                    {equipamentos.filter(e => e.quantidade_disponivel > 0).map(e => (
                                        <option key={e.id} value={e.id}>
                                            [{e.categoria}] {e.descricao} {e.identificacao ? `(${e.identificacao})` : ''} - Disp: {e.quantidade_disponivel}
                                        </option>
                                    ))}
                                </select>
                                {destinarForm.formState.errors.equipamento_id && <span className="text-xs text-red-500">{destinarForm.formState.errors.equipamento_id.message}</span>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Posto de Trabalho (Femog) *</label>
                                <select
                                    {...destinarForm.register('contrato_id')}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Selecione...</option>
                                    {postosFemog.map(p => (
                                        <option key={p.id} value={p.id}>{p.posto_trabalho}</option>
                                    ))}
                                </select>
                                {destinarForm.formState.errors.contrato_id && <span className="text-xs text-red-500">{destinarForm.formState.errors.contrato_id.message}</span>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Quantidade *</label>
                                <input
                                    type="number"
                                    {...destinarForm.register('quantidade')}
                                    min="1"
                                    value={destinarIsMunicao ? undefined : 1}
                                    disabled={!destinarIsMunicao}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                />
                                {!destinarIsMunicao && (
                                    <p className="text-xs text-slate-500">Armamentos e Coletes: quantidade fixa em 1</p>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsDestinarModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={destinarForm.formState.isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {destinarForm.formState.isSubmitting ? 'Destinando...' : 'Confirmar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Devolver */}
            {isDevolverModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDevolverModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50">
                            <h3 className="text-lg font-bold text-slate-900">Devolver Equipamento</h3>
                            <button onClick={() => setIsDevolverModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={devolverForm.handleSubmit(onSubmitDevolver)} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Equipamento Distribuído *</label>
                                <select
                                    {...devolverForm.register('distribuicao_id')}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Selecione...</option>
                                    {distribuicao.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {d.contratos?.posto_trabalho} - {d.equipamentos?.descricao} {d.equipamentos?.identificacao ? `(${d.equipamentos.identificacao})` : ''} - Qtd: {d.quantidade}
                                        </option>
                                    ))}
                                </select>
                                {devolverForm.formState.errors.distribuicao_id && <span className="text-xs text-red-500">{devolverForm.formState.errors.distribuicao_id.message}</span>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Quantidade a Devolver *</label>
                                <input
                                    type="number"
                                    {...devolverForm.register('quantidade')}
                                    min="1"
                                    value={devolverIsMunicao ? undefined : 1}
                                    disabled={!devolverIsMunicao}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                                />
                                {!devolverIsMunicao && devolverDistIdWatch && (
                                    <p className="text-xs text-slate-500">Armamentos e Coletes: quantidade fixa em 1</p>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsDevolverModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={devolverForm.formState.isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
                                >
                                    {devolverForm.formState.isSubmitting ? 'Devolvendo...' : 'Confirmar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onCancel={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Excluir Equipamento"
                message={`Tem certeza que deseja excluir "${itemToDelete?.descricao}"?`}
            />
        </div>
    );
}
