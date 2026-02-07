import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ResponsiveTable from '../../components/ResponsiveTable';
import { useModal } from '../../context/ModalContext';
import { rhService } from '../../services/rhService';
import type { CargoSalario } from './types';
import CargosSalariosForm from './components/CargosSalariosForm';
import CargoSalarioDetails from './components/CargoSalarioDetails';
import { formatCurrency } from '../../utils/format';

const CargosSalarios: React.FC = () => {
    const { openFormModal, openViewModal, closeModal, showFeedback } = useModal();
    const [cargos, setCargos] = useState<CargoSalario[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'TODOS' | 'FEMOG' | 'SEMOG'>('TODOS');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCargos = async () => {
        setLoading(true);
        try {
            const data = await rhService.getCargosSalarios();
            setCargos(data);
        } catch (error) {
            console.error('Erro ao buscar cargos:', error);
            showFeedback('error', 'Erro ao carregar cargos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCargos();
    }, []);

    const handleCreate = () => {
        openFormModal('Novo Cargo', <CargosSalariosForm onSuccess={fetchCargos} />);
    };

    const handleEdit = (cargo: CargoSalario) => {
        openFormModal(
            `Editar Cargo`,
            <CargosSalariosForm initialData={cargo} onSuccess={fetchCargos} />
        );
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este cargo?')) {
            try {
                await rhService.deleteCargoSalario(id);
                showFeedback('success', 'Cargo excluído com sucesso!');
                fetchCargos();
                closeModal();
            } catch (error) {
                console.error('Erro ao excluir cargo:', error);
                showFeedback('error', 'Erro ao excluir cargo.');
            }
        }
    };

    const handleRowClick = (cargo: CargoSalario) => {
        openViewModal(
            `Detalhes do Cargo`,
            <CargoSalarioDetails cargo={cargo} />,
            {
                canEdit: true,
                canDelete: true,
                onEdit: () => handleEdit(cargo),
                onDelete: () => handleDelete(cargo.id)
            }
        );
    };

    const filteredCargos = cargos.filter(cargo => {
        const matchesCompany = activeTab === 'TODOS' || cargo.empresa === activeTab;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = cargo.cargo.toLowerCase().includes(searchLower) ||
            (cargo.uf || '').toLowerCase().includes(searchLower);
        return matchesCompany && matchesSearch;
    });

    const columns = [
        {
            header: 'Cargo / UF',
            key: 'cargo',
            render: (cargo: CargoSalario) => (
                <div>
                    <div className="font-medium text-gray-900">{cargo.cargo}</div>
                    <div className="text-sm text-gray-500">{cargo.uf}</div>
                </div>
            )
        },
        {
            header: 'Salário Base',
            key: 'salario_base',
            render: (cargo: CargoSalario) => (
                <div className="font-medium text-gray-900">
                    {formatCurrency(cargo.salario_base)}
                </div>
            )
        },
        {
            header: 'Empresa',
            key: 'empresa',
            render: (cargo: CargoSalario) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cargo.empresa === 'FEMOG' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                    {cargo.empresa}
                </span>
            )
        },
        {
            header: 'HE Diurno / Noturno',
            key: 'valor_he_diurno',
            render: (cargo: CargoSalario) => (
                <div className="text-sm">
                    <div className="text-gray-900"><span className="text-xs text-gray-500">D:</span> {formatCurrency(cargo.valor_he_diurno)}</div>
                    <div className="text-gray-900"><span className="text-xs text-gray-500">N:</span> {formatCurrency(cargo.valor_he_noturno)}</div>
                </div>
            )
        }
    ];

    const renderCard = (cargo: CargoSalario) => (
        <div className="space-y-3">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-medium text-gray-900">{cargo.cargo}</h3>
                    <p className="text-sm text-gray-500">{cargo.uf}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cargo.empresa === 'FEMOG' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                    {cargo.empresa}
                </span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Salário Base:</span>
                <span className="font-medium text-gray-900">{formatCurrency(cargo.salario_base)}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500">HE Diurna</span>
                    <span className="font-medium text-gray-900">{formatCurrency(cargo.valor_he_diurno)}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500">HE Noturna</span>
                    <span className="font-medium text-gray-900">{formatCurrency(cargo.valor_he_noturno)}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Cargos e Salários"
                subtitle="Gerencie os cargos, salários e adicionais das empresas."
                action={
                    <div className="flex flex-col md:flex-row gap-3">
                        <button
                            onClick={handleCreate}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto"
                        >
                            <Plus size={20} />
                            Novo Cargo
                        </button>
                    </div>
                }
            />

            {/* Filters - Top Bar (Search) */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por cargo..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Filters - Bottom Bar (Tabs) */}
            <div className="flex bg-white p-1 rounded-lg w-fit shadow-sm">
                {(['TODOS', 'FEMOG', 'SEMOG'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab
                            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {tab === 'TODOS' ? 'Todas' : tab}
                    </button>
                ))}
            </div>

            <ResponsiveTable<CargoSalario>
                data={filteredCargos}
                columns={columns}
                onRowClick={handleRowClick}
                emptyMessage="Nenhum cargo encontrado."
                renderCard={renderCard}
                keyExtractor={(item) => item.id}
                loading={loading}
            />
        </div>
    );
};

export default CargosSalarios;
