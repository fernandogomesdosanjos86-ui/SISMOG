import React, { useState } from 'react';
import { Plus, Search, FileText, Building2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ResponsiveTable from '../../components/ResponsiveTable';
import StatCard from '../../components/StatCard';
import PrimaryButton from '../../components/PrimaryButton';
import { useModal } from '../../context/ModalContext';
import { useApontamentos } from './hooks/useApontamentos';
import ApontamentoForm from './components/ApontamentoForm';
import ApontamentoDetails from './components/ApontamentoDetails';
import type { Apontamento } from './types';
import { useDebounce } from '../../hooks/useDebounce';
import CompanyBadge from '../../components/CompanyBadge';

const formatScore = (score: number) => {
    if (score > 0) return <span className="text-green-600 font-bold">+{score}</span>;
    if (score < 0) return <span className="text-red-600 font-bold">{score}</span>;
    return <span className="text-gray-500 font-medium">{score}</span>;
};

const Apontamentos: React.FC = () => {
    const { openFormModal, openViewModal, closeModal } = useModal();

    // Date State (YYYY-MM)
    const [competencia, setCompetencia] = useState(new Date().toISOString().substring(0, 7));

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [companyFilter, setCompanyFilter] = useState<'TODOS' | 'FEMOG' | 'SEMOG'>('TODOS');

    // Fetch Data
    const year = parseInt(competencia.split('-')[0]);
    const month = parseInt(competencia.split('-')[1]);
    const { apontamentos, isLoading, refetch, create, update, delete: deleteService } = useApontamentos(month, year);

    // Grouping logic by employee
    const groupedData = React.useMemo(() => {
        const groups: Record<string, {
            funcionario_id: string;
            funcionario_nome: string;
            empresa: 'FEMOG' | 'SEMOG';
            total_frequencia: number;
            total_beneficios: number;
            items: Apontamento[];
        }> = {};

        // 1. First filter
        const filtered = apontamentos.filter(a => {
            const matchesCompany = companyFilter === 'TODOS' || a.empresa === companyFilter;
            const matchesSearch = (a.funcionario?.nome || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                (a.posto?.nome || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            return matchesCompany && matchesSearch;
        });

        // 2. Then group
        filtered.forEach(item => {
            if (!groups[item.funcionario_id]) {
                groups[item.funcionario_id] = {
                    funcionario_id: item.funcionario_id,
                    funcionario_nome: item.funcionario?.nome || 'Desconhecido',
                    empresa: item.empresa,
                    total_frequencia: 0,
                    total_beneficios: 0,
                    items: []
                };
            }
            groups[item.funcionario_id].total_frequencia += item.frequencia_pts;
            groups[item.funcionario_id].total_beneficios += item.beneficios_pts;
            groups[item.funcionario_id].items.push(item);
        });

        // Convert to array and sort by name
        return Object.values(groups).sort((a, b) => a.funcionario_nome.localeCompare(b.funcionario_nome));
    }, [apontamentos, debouncedSearchTerm, companyFilter]);

    // KPIs
    const totalApontamentos = apontamentos.length;
    const apontamentosFemog = apontamentos.filter(a => a.empresa === 'FEMOG').length;
    const apontamentosSemog = apontamentos.filter(a => a.empresa === 'SEMOG').length;

    // Actions
    const handleNew = () => {
        openFormModal(
            'Novo Apontamento',
            <ApontamentoForm onSuccess={() => { refetch(); closeModal(); }} create={create} update={(id, data) => update({ id, data })} />
        );
    };

    const handleEdit = (item: Apontamento) => {
        openFormModal(
            'Editar Apontamento',
            <ApontamentoForm
                initialData={item}
                onSuccess={() => { refetch(); closeModal(); }}
                create={create}
                update={(id, data) => update({ id, data })}
            />
        );
    };

    const handleViewDetails = (group: typeof groupedData[0]) => {
        openViewModal(
            'Detalhes do Apontamento',
            <ApontamentoDetails
                employeeName={group.funcionario_nome}
                apontamentos={group.items}
                onEdit={handleEdit}
                onDelete={async (id) => await deleteService(id)}
            />
        );
    };

    const columns = [
        {
            header: 'Funcionário',
            key: 'funcionario_nome',
            render: (item: typeof groupedData[0]) => (
                <div className="font-medium text-gray-900">{item.funcionario_nome}</div>
            )
        },
        {
            header: 'Empresa',
            key: 'empresa',
            render: (item: typeof groupedData[0]) => <CompanyBadge company={item.empresa as any} />
        },
        {
            header: 'Pts Frequência',
            key: 'total_frequencia',
            render: (item: typeof groupedData[0]) => (
                <div className="text-gray-700">{formatScore(item.total_frequencia)}</div>
            )
        },
        {
            header: 'Pts Benefícios',
            key: 'total_beneficios',
            render: (item: typeof groupedData[0]) => (
                <div className="text-gray-700">{formatScore(item.total_beneficios)}</div>
            )
        },
        {
            header: 'Registros',
            key: 'registros',
            render: (item: typeof groupedData[0]) => (
                <div className="text-gray-500 text-sm">{item.items.length} apontamento(s)</div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Apontamentos"
                subtitle="Gestão de Frequência"
                action={
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <input
                            type="month"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                            value={competencia}
                            onChange={(e) => setCompetencia(e.target.value)}
                        />
                        <PrimaryButton
                            onClick={handleNew}
                            className="w-full sm:w-auto"
                            icon={<Plus size={20} />}
                        >
                            Lançamento
                        </PrimaryButton>
                    </div>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total de Apontamentos"
                    value={totalApontamentos.toString()}
                    icon={FileText}
                    type="total"
                />
                <StatCard
                    title="Apontamentos FEMOG"
                    value={apontamentosFemog.toString()}
                    icon={Building2}
                    type="info"
                />
                <StatCard
                    title="Apontamentos SEMOG"
                    value={apontamentosSemog.toString()}
                    icon={Building2}
                    type="warning"
                />
            </div>

            {/* Resumo Card and Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar funcionário ou posto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Company Tabs */}
            <div className="flex bg-white p-1 rounded-lg w-fit shadow-sm">
                {['TODOS', 'FEMOG', 'SEMOG'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setCompanyFilter(tab as any)}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${companyFilter === tab
                            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {tab === 'TODOS' ? 'Todas' : tab}
                    </button>
                ))}
            </div>

            {/* Data Table */}
            <ResponsiveTable
                data={groupedData}
                columns={columns}
                keyExtractor={(item) => item.funcionario_id}
                onRowClick={handleViewDetails}
                loading={isLoading}
                skeletonRows={3}
                getRowBorderColor={(item) => item.empresa === 'FEMOG' ? 'border-blue-500' : 'border-orange-500'}
                renderCard={(item) => (
                    <div className={`border-l-4 pl-3 py-1 ${item.empresa === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-gray-900">{item.funcionario_nome}</h4>
                                <div className="mt-1">
                                    <CompanyBadge company={item.empresa as any} />
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {item.items.length} reg.
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-gray-50 rounded-lg text-center">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase">Frequência</p>
                                <p className="font-semibold text-lg">{formatScore(item.total_frequencia)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase">Benefícios</p>
                                <p className="font-semibold text-lg">{formatScore(item.total_beneficios)}</p>
                            </div>
                        </div>
                    </div>
                )}
            />

            {isLoading && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}
        </div>
    );
};

export default Apontamentos;
