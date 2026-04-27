import React, { useState, useMemo } from 'react';
import { Plus, Search, Users, CheckCircle, XCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ResponsiveTable from '../../components/ResponsiveTable';
import StatCard from '../../components/StatCard';
import PrimaryButton from '../../components/PrimaryButton';
import { useModal } from '../../context/ModalContext';
import { useFuncionariosEventos } from './hooks/useFuncionariosEventos';
import FuncionariosEventosForm from './pages/FuncionariosEventosForm';
import FuncionariosEventosDetails from './pages/FuncionariosEventosDetails';
import type { FuncionarioEvento } from './types';
import { useDebounce } from '../../hooks/useDebounce';
import { normalizeSearchString } from '../../utils/normalization';

const isReciclagemEmDia = (dateStr?: string) => {
    if (!dateStr) return false;
    return new Date(dateStr) > new Date();
};

const formatCPF = (cpf: string) => {
    if (!cpf) return '-';
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return cpf;
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const formatTelefone = (telefone: string) => {
    if (!telefone) return '-';
    const digits = telefone.replace(/\D/g, '');
    if (digits.length !== 11 && digits.length !== 10) return telefone;
    if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
};

const FuncionariosEventos: React.FC = () => {
    const { openFormModal, openViewModal, openConfirmModal, closeModal, showFeedback } = useModal();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [statusFilter, setStatusFilter] = useState<'Todos' | 'Apto' | 'Inapto'>('Todos');
    const [reciclagemFilter, setReciclagemFilter] = useState<'Todos' | 'Em dia' | 'Vencida'>('Todos');

    // Fetch Data
    const { funcionariosEventos, isLoading, refetch, create, update, delete: deleteService } = useFuncionariosEventos();

    // Filtering
    const filteredData = useMemo(() => {
        
        const searchNormalized = normalizeSearchString(debouncedSearchTerm);
        const filtered = funcionariosEventos.filter(a => {
            const isEmDia = isReciclagemEmDia(a.validade_reciclagem);
            
            const matchesStatus = statusFilter === 'Todos' || a.status === statusFilter;
            const matchesReciclagem = reciclagemFilter === 'Todos' || 
                (reciclagemFilter === 'Em dia' && isEmDia) || 
                (reciclagemFilter === 'Vencida' && !isEmDia);
            
            const nameMatch = normalizeSearchString(a.funcionario_nome || '').includes(searchNormalized);
            const cpfMatch = normalizeSearchString(a.cpf || '').includes(searchNormalized);
            const cargoMatch = normalizeSearchString(a.cargo || '').includes(searchNormalized);
            
            const matchesSearch = nameMatch || cpfMatch || cargoMatch;

            return matchesStatus && matchesReciclagem && matchesSearch;
        });

        return filtered;
    }, [funcionariosEventos, debouncedSearchTerm, statusFilter, reciclagemFilter]);

    // KPIs
    const totalAptos = filteredData.filter(g => g.status === 'Apto').length;
    const totalInaptos = filteredData.filter(g => g.status === 'Inapto').length;

    // Actions
    const handleNew = () => {
        openFormModal(
            'Novo Funcionário de Evento',
            <FuncionariosEventosForm onSuccess={() => { refetch(); closeModal(); }} create={create} update={(id, data) => update({ id, data })} />
        );
    };

    const handleEdit = (item: FuncionarioEvento) => {
        openFormModal(
            'Editar Funcionário de Evento',
            <FuncionariosEventosForm
                initialData={item}
                onSuccess={() => { refetch(); closeModal(); }}
                create={create}
                update={(id, data) => update({ id, data })}
            />
        );
    };

    const handleViewDetails = (item: FuncionarioEvento) => {
        openViewModal(
            'Detalhes do Funcionário em Eventos',
            <FuncionariosEventosDetails funcionario={item} />,
            {
                canEdit: true,
                canDelete: true,
                onEdit: () => {
                    closeModal(); // Close details modal first
                    handleEdit(item);
                },
                onDelete: () => {
                    openConfirmModal(
                        'Excluir Registro',
                        `Tem certeza que deseja excluir o funcionário ${item.funcionario_nome}?`,
                        async () => {
                            try {
                                await deleteService(item.id);
                                showFeedback('success', 'Registro excluído com sucesso.');
                            } catch (error) {
                                showFeedback('error', 'Erro ao excluir o registro.');
                            }
                        }
                    );
                }
            }
        );
    };

    const columns = [
        {
            header: 'Funcionário / CPF',
            key: 'funcionario',
            render: (item: FuncionarioEvento) => (
                <div>
                    <div className="font-medium text-gray-900">{item.funcionario_nome}</div>
                    <div className="text-xs text-gray-500">{formatCPF(item.cpf)}</div>
                </div>
            )
        },
        {
            header: 'Cargo',
            key: 'cargo',
            render: (item: FuncionarioEvento) => (
                <div className="text-gray-700 font-medium">{item.cargo}</div>
            )
        },
        {
            header: 'Grandes Eventos',
            key: 'grandes_eventos',
            render: (item: FuncionarioEvento) => (
                <span className={item.grandes_eventos ? 'text-green-600 font-bold' : 'text-gray-400'}>
                    {item.grandes_eventos ? 'SIM' : 'NÃO'}
                </span>
            )
        },
        {
            header: 'Reciclagem',
            key: 'reciclagem',
            render: (item: FuncionarioEvento) => {
                const isEmDia = isReciclagemEmDia(item.validade_reciclagem);
                return (
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${isEmDia ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {item.validade_reciclagem ? (isEmDia ? 'Em dia' : 'Vencida') : 'N/A'}
                    </span>
                );
            }
        },
        {
            header: 'Status',
            key: 'status',
            render: (item: FuncionarioEvento) => (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${item.status === 'Apto' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.status}
                </span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Funcionários Eventos"
                subtitle="Gestão e triagem de funcionários aptos para eventos"
                action={
                    <PrimaryButton
                        onClick={handleNew}
                        className="w-full sm:w-auto"
                        icon={<Plus size={20} />}
                    >
                        Novo Registro
                    </PrimaryButton>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Cadastrados"
                    value={filteredData.length.toString()}
                    icon={Users}
                    type="total"
                />
                <StatCard
                    title="Aptos"
                    value={totalAptos.toString()}
                    icon={CheckCircle}
                    type="success"
                />
                <StatCard
                    title="Inaptos"
                    value={totalInaptos.toString()}
                    icon={XCircle}
                    type="danger"
                />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, CPF ou cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                    <select
                        value={reciclagemFilter}
                        onChange={(e) => setReciclagemFilter(e.target.value as any)}
                        className="border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="Todos">Todos</option>
                        <option value="Em dia">Em dia</option>
                        <option value="Vencida">Vencida</option>
                    </select>
                </div>
            </div>

            {/* Status Tabs (Abas) */}
            <div className="flex bg-white p-1 rounded-lg w-fit shadow-sm">
                {['Todos', 'Apto', 'Inapto'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setStatusFilter(tab as any)}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${statusFilter === tab
                            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {tab === 'Apto' ? 'Aptos' : tab === 'Inapto' ? 'Inaptos' : tab}
                    </button>
                ))}
            </div>

            {/* Data Table */}
            <ResponsiveTable
                data={filteredData}
                columns={columns}
                keyExtractor={(item) => item.id}
                onRowClick={handleViewDetails}
                loading={isLoading}
                skeletonRows={3}
                getRowBorderColor={(item) => item.status === 'Apto' ? 'border-green-500' : 'border-red-500'}
                renderCard={(item) => {
                    const isEmDia = isReciclagemEmDia(item.validade_reciclagem);
                    return (
                        <div className={`border-l-4 pl-3 py-1 ${item.status === 'Apto' ? 'border-l-green-500' : 'border-l-red-500'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-gray-900">{item.funcionario_nome}</h4>
                                    <div className="text-xs text-gray-500 mt-1">CPF: {formatCPF(item.cpf)}</div>
                                    <div className="text-sm font-medium text-gray-700 mt-1">{item.cargo}</div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${item.status === 'Apto' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {item.status}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${isEmDia ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        Reciclagem: {item.validade_reciclagem ? (isEmDia ? 'Em dia' : 'Vencida') : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                }}
            />

            {isLoading && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}
        </div>
    );
};

export default FuncionariosEventos;
