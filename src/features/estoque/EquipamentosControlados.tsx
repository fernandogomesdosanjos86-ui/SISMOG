import { useEffect, useState } from 'react';

import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import StatusBadge from '../../components/StatusBadge';
import { useModal } from '../../context/ModalContext';
import { equipamentosService } from '../../services/equipamentosService';
import type { Equipamento, EquipamentoDestinacao, EquipamentoCategoria } from './types';
import EquipamentoForm from './components/EquipamentoForm';
import DestinarForm from './components/DestinarForm';
import DevolverForm from './components/DevolverForm';
import { Plus, Archive, CornerUpLeft, Shield, Box, Crosshair, Search } from 'lucide-react';
import { financeiroService } from '../../services/financeiroService'; // For Posto filter

const EquipamentosControlados: React.FC = () => {
    const { openFormModal, showFeedback } = useModal();

    const [activeTab, setActiveTab] = useState<'Estoque' | 'Postos'>('Estoque');
    const [loading, setLoading] = useState(true);

    // Data
    const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
    const [destinacoes, setDestinacoes] = useState<EquipamentoDestinacao[]>([]);
    const [postosFEMOG, setPostosFEMOG] = useState<{ id: string, nome: string }[]>([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [categoriaFilter, setCategoriaFilter] = useState<'Todas' | EquipamentoCategoria>('Todas');
    const [postoFilter, setPostoFilter] = useState('Todos');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [eqData, destData, contrData] = await Promise.all([
                equipamentosService.getEquipamentos(),
                equipamentosService.getDestinacoes(),
                financeiroService.getContratos()
            ]);
            setEquipamentos(eqData);
            setDestinacoes(destData);

            // Extract unique posts that have equipment (or all FEMOG posts? Req said "Posto Dropdown")
            // Assuming filter should list all potential FEMOG posts or only those with equipment.
            // Requirement: "Posto (select: Todos / lista de postos FEMOG com equipamentos)"
            const uniquePostosIds = new Set(destData.map(d => d.contrato_id));
            const postos = contrData
                .filter(c => c.empresa === 'FEMOG' && uniquePostosIds.has(c.id))
                .map(c => ({ id: c.id, nome: c.nome_posto }));

            // Dedupe by ID in case destination has same contract multiple times (it does)
            const uniquePostos = Array.from(new Map(postos.map(item => [item.id, item])).values()).sort((a, b) => a.nome.localeCompare(b.nome));
            setPostosFEMOG(uniquePostos);

        } catch (error) {
            console.error(error);
            showFeedback('error', 'Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Handlers
    const handleCreate = () => openFormModal('Novo Equipamento', <EquipamentoForm onSuccess={fetchData} />);
    const handleDestinar = () => openFormModal('Destinar Equipamento', <DestinarForm onSuccess={fetchData} />);
    const handleDevolver = () => openFormModal('Devolver Equipamento', <DevolverForm onSuccess={fetchData} />);

    // Edit/Delete
    const handleRowClick = (item: any) => {
        // Only allow Edit/Delete on Estoque tab for now, or define logic.
        if (activeTab === 'Estoque') {
            const eq = item as Equipamento;
            openFormModal('Editar Equipamento', <EquipamentoForm initialData={eq} onSuccess={fetchData} />);
        }
    };

    // Filter Logic
    const filteredEquipamentos = equipamentos.filter(e => {
        const matchSearch = e.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (e.identificacao?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
        const matchCat = categoriaFilter === 'Todas' || e.categoria === categoriaFilter;
        return matchSearch && matchCat;
    });

    const filteredDestinacoes = destinacoes.filter(d => {
        const matchSearch = (d.equipamentos?.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
            (d.equipamentos?.identificacao?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
            (d.contratos?.nome_posto.toLowerCase().includes(searchTerm.toLowerCase()) || false);
        const matchCat = categoriaFilter === 'Todas' || d.equipamentos?.categoria === categoriaFilter;
        const matchPosto = postoFilter === 'Todos' || d.contrato_id === postoFilter;
        return matchSearch && matchCat && matchPosto;
    });

    // KPI Cards Calculation (Ignore Inactive)
    const getKpi = (cat: EquipamentoCategoria) => {
        const items = equipamentos.filter(e => e.categoria === cat && e.status === 'Ativo');
        const total = items.reduce((acc, curr) => acc + curr.quantidade, 0);
        const disponivel = items.reduce((acc, curr) => acc + (curr.disponivel || 0), 0);
        return { total, disponivel, emUso: total - disponivel };
    };

    const armasKpi = getKpi('Armamentos');
    const coletesKpi = getKpi('Coletes Balísticos');
    const municaoKpi = getKpi('Munições');

    // Columns
    const columnsEstoque = [
        { key: 'descricao', header: 'Descrição', render: (i: Equipamento) => <span className="font-medium text-gray-800">{i.descricao}</span> },
        { key: 'identificacao', header: 'Identificação', render: (i: Equipamento) => i.identificacao || '-' },
        { key: 'categoria', header: 'Categoria', render: (i: Equipamento) => i.categoria },
        { key: 'disponivel', header: 'Disponível', render: (i: Equipamento) => <span className={i.disponivel === 0 ? 'text-red-600 font-bold' : 'text-green-600'}>{i.disponivel}/{i.quantidade}</span> },
        { key: 'status', header: 'Status', render: (i: Equipamento) => <StatusBadge active={i.status === 'Ativo'} /> },
    ];

    const columnsPostos = [
        { key: 'posto', header: 'Posto', render: (i: EquipamentoDestinacao) => i.contratos?.nome_posto },
        { key: 'categoria', header: 'Categoria', render: (i: EquipamentoDestinacao) => i.equipamentos?.categoria },
        { key: 'equipamento', header: 'Equipamento', render: (i: EquipamentoDestinacao) => i.equipamentos?.descricao },
        { key: 'identificacao', header: 'Identificação', render: (i: EquipamentoDestinacao) => i.equipamentos?.identificacao || '-' },
        { key: 'quantidade', header: 'Qtd.', render: (i: EquipamentoDestinacao) => i.quantidade },
    ];

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Equipamentos Controlados"
                subtitle="Gestão de Armamento e Munição"
                action={
                    <div className="flex gap-2">
                        <PrimaryButton onClick={handleCreate}><Plus size={16} className="mr-2" />Equipamento</PrimaryButton>
                        <button onClick={handleDestinar} className="px-4 py-2 bg-orange-600 text-white rounded-lg flex items-center hover:bg-orange-700 transition"><Archive size={16} className="mr-2" />Destinar</button>
                        <button onClick={handleDevolver} className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center hover:bg-purple-700 transition"><CornerUpLeft size={16} className="mr-2" />Devolver</button>
                    </div>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="Armamentos" data={armasKpi} icon={Crosshair} color="blue" />
                <Card title="Coletes Balísticos" data={coletesKpi} icon={Shield} color="indigo" />
                <Card title="Munições" data={municaoKpi} icon={Box} color="amber" />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <select
                    className="p-2 border rounded-lg"
                    value={categoriaFilter}
                    onChange={e => setCategoriaFilter(e.target.value as any)}
                >
                    <option value="Todas">Todas Categorias</option>
                    <option value="Armamentos">Armamentos</option>
                    <option value="Coletes Balísticos">Coletes Balísticos</option>
                    <option value="Munições">Munições</option>
                </select>

                {activeTab === 'Postos' && (
                    <select
                        className="p-2 border rounded-lg"
                        value={postoFilter}
                        onChange={e => setPostoFilter(e.target.value)}
                    >
                        <option value="Todos">Todos Postos</option>
                        {postosFEMOG.map(p => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Tabs */}
            <div className="flex bg-white p-1 rounded-lg w-fit shadow-sm">
                {['Estoque', 'Postos'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab
                            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        {tab === 'Estoque' ? 'Estoque Geral' : 'Postos de Trabalho'}
                    </button>
                ))}
            </div>

            {/* Tables */}
            {activeTab === 'Estoque' ? (
                <ResponsiveTable
                    data={filteredEquipamentos}
                    columns={columnsEstoque}
                    keyExtractor={i => i.id}
                    onRowClick={handleRowClick}
                    renderCard={i => (
                        <div className="flex flex-col gap-1 p-2 border-l-4 border-blue-500">
                            <div className="flex justify-between font-bold"><span>{i.descricao}</span><span>{i.disponivel}/{i.quantidade}</span></div>
                            <div className="text-sm text-gray-600">{i.categoria} {i.identificacao && `- ${i.identificacao}`}</div>
                            <StatusBadge active={i.status === 'Ativo'} />
                        </div>
                    )}
                />
            ) : (
                <ResponsiveTable
                    data={filteredDestinacoes}
                    columns={columnsPostos}
                    keyExtractor={i => i.id}
                    renderCard={i => (
                        <div className="flex flex-col gap-1 p-2 border-l-4 border-orange-500">
                            <div className="font-bold">{i.contratos?.nome_posto}</div>
                            <div className="text-sm">{i.equipamentos?.descricao} (Qtd: {i.quantidade})</div>
                            <div className="text-xs text-gray-500">{i.equipamentos?.categoria}</div>
                        </div>
                    )}
                />
            )}
            {loading && (
                <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}
        </div>
    );
};

const Card = ({ title, data, icon: Icon, color }: any) => {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
    };
    // @ts-ignore
    const theme = colorClasses[color];

    return (
        <div className={`bg-white p-4 rounded-xl shadow-sm border flex items-center justify-between`}>
            <div>
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-800">{data.disponivel}</span>
                    <span className="text-xs text-gray-400">/ {data.total} total</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{data.emUso} em uso</p>
            </div>
            <div className={`p-3 rounded-lg ${theme}`}>
                <Icon size={24} />
            </div>
        </div>
    )
}

export default EquipamentosControlados;
