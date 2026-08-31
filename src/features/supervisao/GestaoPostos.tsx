import React, { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import { useModal } from '../../context/ModalContext';
import { usePostos } from './hooks/usePostos';
import type { PostoTrabalho } from './types';
import PostoForm from './components/PostoForm';
import PostoDetails from './components/PostoDetails';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import CompanyBadge from '../../components/CompanyBadge';
import { useDebounce } from '../../hooks/useDebounce';

import FilterTabs from '../../components/ui/FilterTabs';

const GestaoPostos: React.FC = () => {
    const { postos, isLoading, refetch, delete: deletePosto } = usePostos();
    const { openViewModal, openConfirmModal, openFormModal } = useModal();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [companyFilter, setCompanyFilter] = useState<'TODOS' | 'FEMOG' | 'SEMOG'>('TODOS');
    const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ativo' | 'inativo'>('ativo');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Filter Logic
    const filteredPostos = useMemo(() => {
        return postos.filter(posto => {
            const matchesCompany = companyFilter === 'TODOS' || posto.empresa === companyFilter;
            const matchesStatus = statusFilter === 'TODOS' || posto.status === statusFilter;
            const matchesSearch = posto.nome.toLowerCase().includes(debouncedSearch.toLowerCase());
            return matchesCompany && matchesStatus && matchesSearch;
        });
    }, [postos, companyFilter, statusFilter, debouncedSearch]);

    const totalPages = Math.ceil(filteredPostos.length / itemsPerPage);
    const paginatedPostos = useMemo(() => {
        return filteredPostos.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [filteredPostos, currentPage, itemsPerPage]);

    // Reset page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, companyFilter, statusFilter]);

    // KPIs
    const { totalAtivos, totalFemog, totalSemog } = useMemo(() => {
        return {
            totalAtivos: postos.filter(p => p.status === 'ativo').length,
            totalFemog: postos.filter(p => p.status === 'ativo' && p.empresa === 'FEMOG').length,
            totalSemog: postos.filter(p => p.status === 'ativo' && p.empresa === 'SEMOG').length,
        };
    }, [postos]);


    const handleCreate = () => {
        openFormModal('Novo Posto de Trabalho', <PostoForm onSuccess={refetch} />);
    };

    const handleEdit = (posto: PostoTrabalho) => {
        openFormModal(
            `Editar Posto`,
            <PostoForm initialData={posto} onSuccess={refetch} />
        );
    };

    const handleDelete = (posto: PostoTrabalho) => {
        openConfirmModal(
            'Excluir Posto de Trabalho',
            <div className="space-y-3 text-sm text-gray-600">
                <p>
                    <strong className="text-red-700 font-semibold">Atenção!</strong> A exclusão permanente do posto <strong>"{posto.nome}"</strong> apagarátodos os registros vinculados:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                    <li>Alocações e escalas de funcionários</li>
                    <li>Histórico de Serviços Extras (H.E.)</li>
                    <li>Apontamentos de supervisão e frequência</li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs mt-2">
                    💡 <strong>Sugestão:</strong> Para preservar os relatórios financeiros e históricos operacionais, prefira editar o posto e alterar seu status para <strong>"Inativo"</strong>.
                </div>
                <p className="font-medium text-gray-800 pt-1">Deseja realmente prosseguir com a exclusão permanente?</p>
            </div>,
            async () => {
                try {
                    await deletePosto(posto.id);
                } catch {
                    // Handled in usePostos deleteMutation.onError
                }
            }
        );
    };

    const handleView = (posto: PostoTrabalho) => {
        openViewModal(
            'Detalhes do Posto',
            <PostoDetails posto={posto} />,
            {
                canEdit: true,
                canDelete: true,
                onEdit: () => handleEdit(posto),
                onDelete: () => handleDelete(posto)
            }
        );
    };

    const columns = [
        {
            header: 'Posto de Trabalho',
            key: 'nome',
            render: (item: PostoTrabalho) => (
                <div className="font-medium text-gray-900">{item.nome}</div>
            )
        },
        {
            header: 'Empresa',
            key: 'empresa',
            render: (item: PostoTrabalho) => <CompanyBadge company={item.empresa} />
        },
        {
            header: 'Alocações',
            key: 'allocations_count',
            render: (item: PostoTrabalho) => (
                <div className="text-gray-700 flex flex-col">
                    <span className="text-sm">
                        <span className="font-medium">{item.qtd_oficiais || 0}</span> <span className="text-xs text-gray-500">oficiais</span>
                    </span>
                    <span className="text-xs text-gray-500">
                        <span className="font-medium text-gray-700">{item.qtd_he || 0}</span> extras
                    </span>
                </div>
            )
        },
        {
            header: 'Status',
            key: 'status',
            render: (item: PostoTrabalho) => <StatusBadge active={item.status === 'ativo'} />
        }
    ];

    const renderCard = (item: PostoTrabalho) => (
        <div className={`flex flex-col gap-2 relative border-l-4 pl-3 ${item.empresa === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
            <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-900">{item.nome}</h3>
                <StatusBadge active={item.status === 'ativo'} />
            </div>
            <div className="flex justify-between text-sm mt-2">
                <span className="flex gap-3">
                    <span className="text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded border">
                        <span className="font-bold text-gray-800">{item.qtd_oficiais || 0}</span> Oficiais
                    </span>
                    <span className="text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded border">
                        <span className="font-bold text-gray-800">{item.qtd_he || 0}</span> Extras
                    </span>
                </span>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Gestão de Postos"
                subtitle="Gerencie os postos de trabalho e alocação de funcionários."
                action={
                    <PrimaryButton onClick={handleCreate} className="w-full sm:w-auto justify-center">
                        <Plus size={20} className="mr-2" />Novo Posto
                    </PrimaryButton>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Postos Ativos" value={String(totalAtivos)} type="total" />
                <StatCard title="Postos FEMOG" value={String(totalFemog)} type="info" />
                <StatCard title="Postos SEMOG" value={String(totalSemog)} type="warning" />
            </div>

            {/* Filters - Top Bar (Search + Status) */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar posto..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="w-full md:w-auto">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as any)}
                        className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm w-full"
                    >
                        <option value="TODOS">Todos os Status</option>
                        <option value="ativo">Ativos</option>
                        <option value="inativo">Inativos</option>
                    </select>
                </div>
            </div>

            <FilterTabs
                tabs={[
                    { id: 'TODOS', label: 'Todas' },
                    { id: 'FEMOG', label: 'FEMOG' },
                    { id: 'SEMOG', label: 'SEMOG' },
                ]}
                activeTab={companyFilter}
                onChange={(tabId) => setCompanyFilter(tabId as any)}
                className="w-fit mb-4"
            />

            <ResponsiveTable<PostoTrabalho>
                data={paginatedPostos}
                columns={columns}
                onRowClick={handleView}
                emptyMessage="Nenhum posto encontrado."
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

export default GestaoPostos;
