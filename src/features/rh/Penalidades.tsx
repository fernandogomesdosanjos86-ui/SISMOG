import React, { useState } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import StatCard from '../../components/StatCard';
import CompanyBadge from '../../components/CompanyBadge';
import { useModal } from '../../context/ModalContext';
import { useDebounce } from '../../hooks/useDebounce';
import { usePenalidades } from './hooks/usePenalidades';
import PenalidadeForm from './components/PenalidadeForm';
import PenalidadeDetails from './components/PenalidadeDetails';
import type { Penalidade } from './types';

const Penalidades: React.FC = () => {
    const { penalidades, isLoading, deletePenalidade } = usePenalidades();
    const { openConfirmModal, openFormModal, openViewModal, closeModal } = useModal();

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [companyFilter, setCompanyFilter] = useState<'TODOS' | 'FEMOG' | 'SEMOG'>('TODOS');

    // Filtros Locais
    const filteredData = penalidades.filter(p => {
        const matchesCompany = companyFilter === 'TODOS' || p.empresa === companyFilter;
        const matchesSearch = (p.funcionario?.nome || '').toLowerCase().includes(debouncedSearch.toLowerCase());
        return matchesCompany && matchesSearch;
    });

    // Grouping logic por funcionário id
    const groups = filteredData.reduce((acc, penalidade) => {
        const key = penalidade.funcionario_id;
        if (!acc[key]) {
            acc[key] = {
                funcionario_id: key,
                funcionario_nome: penalidade.funcionario?.nome || 'Desconhecido',
                empresa: penalidade.empresa,
                registros: []
            };
        }
        acc[key].registros.push(penalidade);
        return acc;
    }, {} as Record<string, { funcionario_id: string, funcionario_nome: string, empresa: 'FEMOG' | 'SEMOG', registros: Penalidade[] }>);

    const groupedArray = Object.values(groups).sort((a, b) => a.funcionario_nome.localeCompare(b.funcionario_nome));

    const handleCreate = () => {
        openFormModal('Nova Penalidade', <PenalidadeForm />);
    };

    const handleEdit = (penalidade: Penalidade) => {
        openFormModal('Editar Penalidade', <PenalidadeForm initialData={penalidade} onSuccess={closeModal} />);
    };

    const handleDelete = (penalidade: Penalidade) => {
        openConfirmModal(
            'Excluir Penalidade',
            `Tem certeza que deseja excluir a ${penalidade.penalidade} de ${penalidade.funcionario?.nome}?`,
            async () => {
                await deletePenalidade({ id: penalidade.id, fileUrl: penalidade.arquivo_url });
                closeModal(); // Also close details modal if open
            }
        );
    };

    const handleViewDetails = (grupo: typeof groupedArray[0]) => {
        openViewModal(
            'Detalhes da Penalidade',
            <PenalidadeDetails
                employeeName={grupo.funcionario_nome}
                penalidades={grupo.registros}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        );
    };

    // KPIs
    const totalPenalidades = penalidades.length;
    const totalFemog = penalidades.filter(p => p.empresa === 'FEMOG').length;
    const totalSemog = penalidades.filter(p => p.empresa === 'SEMOG').length;

    // Componente customizado para a linha expandida no mobile (ou details view)
    const renderCard = (grupo: any) => (
        <div className={`border-l-4 pl-3 py-1 ${grupo.empresa === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-gray-900">{grupo.funcionario_nome}</h4>
                    <div className="mt-1.5">
                        <CompanyBadge company={grupo.empresa} />
                    </div>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {grupo.registros.length} reg.
                </span>
            </div>
        </div>
    );

    const columns = [
        {
            key: 'funcionario',
            header: 'Funcionário',
            render: (i: any) => (
                <div className="font-medium text-gray-900">{i.funcionario_nome}</div>
            )
        },
        {
            key: 'empresa',
            header: 'Empresa',
            render: (i: any) => (
                <CompanyBadge company={i.empresa} />
            )
        },
        {
            key: 'qtd',
            header: 'Qtd. Penalidades',
            render: (i: any) => (
                <div className="text-gray-500 text-sm">{i.registros.length} registro(s)</div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Penalidades"
                subtitle="Registro de advertências e suspensões."
                action={
                    <div className="w-full sm:w-auto">
                        <PrimaryButton onClick={handleCreate} className="w-full justify-center bg-red-600 hover:bg-red-700 focus:ring-red-500">
                            <Plus size={20} className="mr-2" />
                            Registrar Penalidade
                        </PrimaryButton>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard
                    title="Total"
                    value={String(totalPenalidades)}
                    type="danger"
                    icon={AlertTriangle}
                />
                <StatCard
                    title="Aplicações FEMOG"
                    value={String(totalFemog)}
                    type="info"
                    icon={AlertTriangle}
                />
                <StatCard
                    title="Aplicações SEMOG"
                    value={String(totalSemog)}
                    type="warning"
                    icon={AlertTriangle}
                />
            </div>

            {/* Filters - Top Bar (Search) */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar funcionário..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Filters - Bottom Bar (Tabs) */}
            <div className="flex bg-white p-1 rounded-lg w-fit shadow-sm overflow-x-auto mb-4">
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

            <ResponsiveTable
                data={groupedArray}
                columns={columns}
                emptyMessage="Nenhuma penalidade registrada nos filtros atuais."
                renderCard={renderCard}
                onRowClick={handleViewDetails}
                keyExtractor={(item) => item.funcionario_id}
                loading={isLoading}
                getRowBorderColor={(item) => item.empresa === 'FEMOG' ? 'border-blue-500' : 'border-orange-500'}
            />
        </div>
    );
};

export default Penalidades;
