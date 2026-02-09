import React, { useState } from 'react';
import { Plus, Search, Users, UserCheck } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import CompanyBadge from '../../components/CompanyBadge';
import StatusBadge from '../../components/StatusBadge';
import { useModal } from '../../context/ModalContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useFuncionarios } from './hooks/useFuncionarios';
import FuncionarioForm from './components/FuncionarioForm';
import FuncionarioDetails from './components/FuncionarioDetails';
import type { Funcionario } from './types';

const Funcionarios: React.FC = () => {
    const { funcionarios, isLoading, refetch, delete: deleteFuncionario } = useFuncionarios();
    const { openViewModal, openConfirmModal, openFormModal, showFeedback } = useModal();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [companyFilter, setCompanyFilter] = useState<'TODOS' | 'FEMOG' | 'SEMOG'>('TODOS');
    const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ativo' | 'inativo'>('ativo'); // Default Active
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Filter Logic
    const filteredFuncionarios = funcionarios.filter(func => {
        const matchesCompany = companyFilter === 'TODOS' || func.empresa === companyFilter;
        const matchesStatus = statusFilter === 'TODOS' || func.status === statusFilter;

        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch =
            func.nome.toLowerCase().includes(searchLower) ||
            (func.cpf || '').includes(searchLower) ||
            (func.cargos_salarios?.cargo || '').toLowerCase().includes(searchLower);

        return matchesCompany && matchesStatus && matchesSearch;
    });

    const totalPages = Math.ceil(filteredFuncionarios.length / itemsPerPage);
    const paginatedFuncionarios = filteredFuncionarios.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, companyFilter, statusFilter]);

    // CRUD Handlers
    const handleCreate = () => {
        openFormModal('Novo Funcionário', <FuncionarioForm onSuccess={refetch} />);
    };

    const handleView = (func: Funcionario) => {
        openViewModal(
            'Detalhes do Funcionário',
            <FuncionarioDetails funcionario={func} />,
            {
                canEdit: true,
                canDelete: true,
                onEdit: () => openFormModal('Editar Funcionário', <FuncionarioForm initialData={func} onSuccess={refetch} />),
                onDelete: () => openConfirmModal(
                    'Excluir Funcionário',
                    `Tem certeza que deseja excluir ${func.nome}? Esta ação não pode ser desfeita.`,
                    async () => {
                        try {
                            await deleteFuncionario(func.id);
                            showFeedback('success', 'Funcionário excluído com sucesso!');
                        } catch (error) {
                            showFeedback('error', 'Erro ao excluir funcionário.');
                        }
                    }
                )
            }
        );
    };

    // KPIs
    const totalAtivos = funcionarios.filter(f => f.status === 'ativo').length;
    const totalFemog = funcionarios.filter(f => f.status === 'ativo' && f.empresa === 'FEMOG').length;
    const totalSemog = funcionarios.filter(f => f.status === 'ativo' && f.empresa === 'SEMOG').length;

    const columns = [
        {
            key: 'nome',
            header: 'Nome',
            render: (i: Funcionario) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{i.nome}</span>
                    <span className="text-xs text-gray-500">{i.cpf}</span>
                </div>
            )
        },
        {
            key: 'cargo',
            header: 'Cargo / UF',
            render: (i: Funcionario) => (
                <div className="flex flex-col">
                    <span className="text-sm text-gray-900">{i.cargos_salarios?.cargo || '-'}</span>
                    <span className="text-xs text-gray-500">{i.cargos_salarios?.uf || '-'}</span>
                </div>
            )
        },
        {
            key: 'empresa',
            header: 'Empresa',
            render: (i: Funcionario) => <CompanyBadge company={i.empresa} />
        },
        {
            key: 'status',
            header: 'Status',
            render: (i: Funcionario) => <StatusBadge active={i.status === 'ativo'} activeLabel="Ativo" inactiveLabel="Inativo" />
        }
    ];

    const renderCard = (i: Funcionario) => (
        <div className={`flex flex-col gap-2 relative border-l-4 pl-3 ${i.empresa === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-gray-900">{i.nome}</h3>
                    <p className="text-xs text-gray-500">{i.cargos_salarios?.cargo} - {i.cargos_salarios?.uf}</p>
                </div>
                <StatusBadge active={i.status === 'ativo'} activeLabel="Ativo" inactiveLabel="Inativo" />
            </div>
            <div className="flex justify-between items-center text-sm pt-1">
                <CompanyBadge company={i.empresa} />
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Funcionários"
                subtitle="Gerencie o quadro de colaboradores."
                action={
                    <div className="w-full sm:w-auto">
                        <PrimaryButton onClick={handleCreate} className="w-full justify-center">
                            <Plus size={20} className="mr-2" />
                            Novo Funcionário
                        </PrimaryButton>
                    </div>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-green-600 font-medium">Total Ativos</p>
                        <p className="text-2xl font-bold text-gray-800">{totalAtivos}</p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <Users size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-blue-600 font-medium">Ativos FEMOG</p>
                        <p className="text-2xl font-bold text-gray-800">{totalFemog}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <UserCheck size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-orange-600 font-medium">Ativos SEMOG</p>
                        <p className="text-2xl font-bold text-gray-800">{totalSemog}</p>
                    </div>
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                        <UserCheck size={24} />
                    </div>
                </div>
            </div>

            {/* Filters - Top Bar (Search + Status) */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, CPF ou cargo..."
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
                        <option value="ativo">Ativos</option>
                        <option value="inativo">Inativos</option>
                    </select>
                </div>
            </div>

            {/* Filters - Bottom Bar (Tabs) */}
            <div className="flex bg-white p-1 rounded-lg w-fit shadow-sm">
                {(['TODOS', 'FEMOG', 'SEMOG'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setCompanyFilter(tab)}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${companyFilter === tab
                            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {tab === 'TODOS' ? 'Todas' : tab}
                    </button>
                ))}
            </div>

            <ResponsiveTable<Funcionario>
                data={paginatedFuncionarios}
                columns={columns}
                onRowClick={handleView}
                emptyMessage="Nenhum funcionário encontrado."
                renderCard={renderCard}
                keyExtractor={(item) => item.id}
                loading={isLoading}
                getRowBorderColor={(item) => item.empresa === 'FEMOG' ? 'border-blue-500' : 'border-orange-500'}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 py-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Próxima
                    </button>
                </div>
            )}
        </div>
    );
};

export default Funcionarios;
