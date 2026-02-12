import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ResponsiveTable from '../../components/ResponsiveTable';
import { useModal } from '../../context/ModalContext';
import { usePostos } from './hooks/usePostos';
import type { PostoTrabalho } from './types';
import PostoForm from './components/PostoForm';
import PostoDetails from './components/PostoDetails';
import StatCard from '../../components/StatCard';

const GestaoPostos: React.FC = () => {
    const { postos, isLoading, refetch, delete: deletePosto } = usePostos();
    const { openViewModal, openConfirmModal, openFormModal, showFeedback } = useModal();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [companyFilter, setCompanyFilter] = useState<'TODOS' | 'FEMOG' | 'SEMOG'>('TODOS');
    const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ativo' | 'inativo'>('ativo');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Filter Logic
    const filteredPostos = postos.filter(posto => {
        const matchesCompany = companyFilter === 'TODOS' || posto.empresa === companyFilter;
        const matchesStatus = statusFilter === 'TODOS' || posto.status === statusFilter;
        const matchesSearch = posto.nome.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCompany && matchesStatus && matchesSearch;
    });

    const totalPages = Math.ceil(filteredPostos.length / itemsPerPage);
    const paginatedPostos = filteredPostos.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, companyFilter, statusFilter]);

    // KPIs
    const totalAtivos = postos.filter(p => p.status === 'ativo').length;
    const totalFemog = postos.filter(p => p.status === 'ativo' && p.empresa === 'FEMOG').length;
    const totalSemog = postos.filter(p => p.status === 'ativo' && p.empresa === 'SEMOG').length;


    const handleCreate = () => {
        openFormModal('Novo Posto de Trabalho', <PostoForm onSuccess={refetch} />);
    };

    const handleEdit = (posto: PostoTrabalho) => {
        openFormModal(
            `Editar Posto`,
            <PostoForm initialData={posto} onSuccess={refetch} />
        );
    };

    const handleDelete = (id: string) => {
        openConfirmModal(
            'Excluir Posto',
            'Tem certeza que deseja excluir este posto? Todas as alocações vinculadas serão removidas.',
            async () => {
                try {
                    await deletePosto(id);
                    showFeedback('success', 'Posto excluído com sucesso!');
                } catch (error) {
                    showFeedback('error', 'Erro ao excluir posto.');
                }
            }
        );
    };

    const handleView = (posto: PostoTrabalho) => {
        openViewModal(
            `Detalhes do Posto: ${posto.nome}`,
            <PostoDetails posto={posto} />,
            {
                canEdit: true,
                canDelete: true,
                onEdit: () => handleEdit(posto),
                onDelete: () => handleDelete(posto.id)
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
            render: (item: PostoTrabalho) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.empresa === 'FEMOG' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                    {item.empresa}
                </span>
            )
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
            render: (item: PostoTrabalho) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {item.status}
                </span>
            )
        }
    ];

    const renderCard = (item: PostoTrabalho) => (
        <div className={`flex flex-col gap-2 relative border-l-4 pl-3 ${item.empresa === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
            <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-900">{item.nome}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {item.status}
                </span>
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
                    <button
                        onClick={handleCreate}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Novo Posto
                    </button>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Postos Ativos" value={String(totalAtivos)} type="total" />
                <StatCard title="Postos FEMOG" value={String(totalFemog)} type="info" />
                <StatCard title="Postos SEMOG" value={String(totalSemog)} type="warning" />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Buscar posto..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={companyFilter}
                        onChange={e => setCompanyFilter(e.target.value as any)}
                        className="px-4 py-2 border border-gray-200 rounded-lg bg-white"
                    >
                        <option value="TODOS">Todas Empresas</option>
                        <option value="FEMOG">FEMOG</option>
                        <option value="SEMOG">SEMOG</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as any)}
                        className="px-4 py-2 border border-gray-200 rounded-lg bg-white"
                    >
                        <option value="TODOS">Todos Status</option>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                    </select>
                </div>
            </div>

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
