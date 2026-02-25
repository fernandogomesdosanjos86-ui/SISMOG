import React, { useState } from 'react';
import { Plus, Search, Car, Wrench, Fuel, Zap } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import StatusBadge from '../../components/StatusBadge';
import StatCard from '../../components/StatCard';
import { useModal } from '../../context/ModalContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useVeiculos } from './hooks/useVeiculos';
import VeiculoForm from './components/VeiculoForm';
import VeiculoDetails from './components/VeiculoDetails';
import type { Veiculo } from './types';

const Veiculos: React.FC = () => {
    const { veiculos, isLoading, deleteVeiculo } = useVeiculos();
    const { openViewModal, openConfirmModal, openFormModal, closeModal, showFeedback } = useModal();

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [statusFilter, setStatusFilter] = useState<'TODOS' | 'Ativo' | 'Em Manutenção' | 'Inativo'>('Ativo'); // Default Active

    // Filter Logic
    const filteredVeiculos = veiculos.filter(v => {
        const matchesStatus = statusFilter === 'TODOS' || v.status === statusFilter;

        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch =
            v.marca_modelo.toLowerCase().includes(searchLower) ||
            v.placa.toLowerCase().includes(searchLower);

        return matchesStatus && matchesSearch;
    });

    const handleCreate = () => {
        openFormModal('Novo Veículo', <VeiculoForm onSuccess={closeModal} />);
    };

    const handleView = (veiculo: Veiculo) => {
        openViewModal(
            'Detalhes do Veículo',
            <VeiculoDetails veiculo={veiculo} />,
            {
                canEdit: true,
                canDelete: true,
                onEdit: () => { handleEdit(veiculo); },
                onDelete: () => { handleDelete(veiculo); }
            }
        );
    };

    const handleEdit = (veiculo: Veiculo) => {
        openFormModal('Editar Veículo', <VeiculoForm initialData={veiculo} onSuccess={closeModal} />);
    };

    const handleDelete = (veiculo: Veiculo) => {
        openConfirmModal(
            'Excluir Veículo',
            `Tem certeza que deseja excluir o veículo ${veiculo.marca_modelo} (${veiculo.placa})?`,
            async () => {
                try {
                    await deleteVeiculo(veiculo.id);
                    closeModal();
                } catch (error) {
                    showFeedback('error', 'Erro ao excluir veículo.');
                }
            }
        );
    };

    // KPIs
    const totalVeiculos = veiculos.length;
    const totalAtivos = veiculos.filter(v => v.status === 'Ativo').length;
    const totalManutencao = veiculos.filter(v => v.status === 'Em Manutenção').length;

    const renderCard = (i: Veiculo) => (
        <div className={`border-l-4 pl-3 py-1 ${i.status === 'Ativo' ? 'border-l-green-500' : i.status === 'Em Manutenção' ? 'border-l-orange-500' : 'border-l-gray-400'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-gray-900">{i.marca_modelo}</h4>
                    <span className="text-sm font-mono text-gray-500">{i.placa}</span>
                    <div className="flex items-center gap-2 mt-2">
                        {i.abastecimento ? (
                            <span className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                <Fuel size={14} className="mr-1" /> Abastecimento
                            </span>
                        ) : null}
                        <span className={`flex items-center text-xs px-2 py-1 rounded ${i.tipo === 'Elétrico' ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-100'}`}>
                            {i.tipo === 'Elétrico' ? <Zap size={14} className="mr-1" /> : <Car size={14} className="mr-1" />}
                            {i.tipo}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <StatusBadge active={i.status === 'Ativo'} activeLabel="Ativo" inactiveLabel={i.status} />
                </div>
            </div>
        </div>
    );

    const columns = [
        {
            key: 'veiculo',
            header: 'Veículo',
            render: (i: Veiculo) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{i.marca_modelo}</span>
                    <span className="text-xs text-gray-500 font-mono">{i.placa}</span>
                </div>
            )
        },
        {
            key: 'tipo',
            header: 'Tipo',
            render: (i: Veiculo) => (
                <span className="text-sm text-gray-600 flex items-center gap-1">
                    {i.tipo === 'Elétrico' ? <Zap size={16} className="text-green-500" /> : <Car size={16} className="text-gray-400" />}
                    {i.tipo}
                </span>
            )
        },
        {
            key: 'abastecimento',
            header: 'Abastecimento',
            render: (i: Veiculo) => (
                i.abastecimento ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        <Fuel size={14} /> Ativo
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Não
                    </span>
                )
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (i: Veiculo) => (
                <StatusBadge
                    active={i.status === 'Ativo'}
                    activeLabel="Ativo"
                    inactiveLabel={i.status}
                />
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Gestão de Frota"
                subtitle="Gerencie os veículos corporativos, características e manutenções."
                action={
                    <div className="w-full sm:w-auto">
                        <PrimaryButton onClick={handleCreate} className="w-full justify-center">
                            <Plus size={20} className="mr-2" />
                            Novo Veículo
                        </PrimaryButton>
                    </div>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard
                    title="Total Frota"
                    value={String(totalVeiculos)}
                    type="total"
                    icon={Car}
                />
                <StatCard
                    title="Operacionais"
                    value={String(totalAtivos)}
                    type="success"
                    icon={Car}
                />
                <StatCard
                    title="Em Manutenção"
                    value={String(totalManutencao)}
                    type="warning"
                    icon={Wrench}
                />
            </div>

            {/* Filters - Top Bar (Search + Status) */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por marca, modelo ou placa..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-auto">
                    <select
                        className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm w-full"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="TODOS">Todos os Status</option>
                        <option value="Ativo">Apenas Ativos</option>
                        <option value="Em Manutenção">Apenas em Manutenção</option>
                        <option value="Inativo">Apenas Inativos</option>
                    </select>
                </div>
            </div>

            <ResponsiveTable<Veiculo>
                data={filteredVeiculos}
                columns={columns}
                emptyMessage="Nenhum veículo encontrado."
                renderCard={renderCard}
                keyExtractor={(item) => item.id}
                onRowClick={handleView}
                loading={isLoading}
                getRowBorderColor={(item) => item.status === 'Ativo' ? 'border-green-500' : item.status === 'Em Manutenção' ? 'border-orange-500' : 'border-gray-400'}
            />

        </div>
    );
};

export default Veiculos;
