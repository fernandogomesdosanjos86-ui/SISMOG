import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ResponsiveTable from '../../components/ResponsiveTable';
import StatCard from '../../components/StatCard';
import { useModal } from '../../context/ModalContext';
import { useServicosExtras } from './hooks/useServicosExtras';
import ServicoExtraForm from './components/ServicoExtraForm';
import ServicoExtraDetails from './components/ServicoExtraDetails';
import type { ServicoExtra } from './types';

const ServicosExtras: React.FC = () => {
    const { openFormModal, openViewModal, closeModal } = useModal();

    // Date State (YYYY-MM to match Faturamentos)
    const [competencia, setCompetencia] = useState(new Date().toISOString().substring(0, 7));

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [companyFilter, setCompanyFilter] = useState<'TODOS' | 'FEMOG' | 'SEMOG'>('TODOS');

    // Data Hook (filtered by month/year via API)
    const year = parseInt(competencia.split('-')[0]);
    const month = parseInt(competencia.split('-')[1]);
    const { servicos, isLoading, refetch, create, update, delete: deleteService } = useServicosExtras(month, year);

    // Grouping Logic
    // We need to group flat services by Employee to match the visual requirement
    // "Listagem (agrupada por funcionário no mês)"
    const groupedData = React.useMemo(() => {
        const groups: Record<string, {
            id: string; // Use employee ID as Row ID
            key: string;
            funcionario_nome: string;
            empresa: 'FEMOG' | 'SEMOG';
            total_horas: number;
            total_valor: number;
            items: ServicoExtra[];
        }> = {};

        servicos.forEach(service => {
            const funcId = service.funcionario_id;
            if (!groups[funcId]) {
                groups[funcId] = {
                    id: funcId,
                    key: funcId,
                    funcionario_nome: service.funcionario?.nome || 'Desconhecido',
                    empresa: service.empresa,
                    total_horas: 0,
                    total_valor: 0,
                    items: []
                };
            }
            groups[funcId].items.push(service);
            groups[funcId].total_horas += Number(service.duracao);
            groups[funcId].total_valor += Number(service.valor);
        });

        return Object.values(groups).sort((a, b) => a.funcionario_nome.localeCompare(b.funcionario_nome));
    }, [servicos]);

    // Apply Local Filters (Search / Company tab)
    const filteredGroups = groupedData.filter(group => {
        const matchesCompany = companyFilter === 'TODOS' || group.empresa === companyFilter;
        const matchesSearch = group.funcionario_nome.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCompany && matchesSearch;
    });

    // KPI Calcs
    const totalValor = servicos.reduce((sum, s) => sum + Number(s.valor), 0);
    const totalFemog = servicos.filter(s => s.empresa === 'FEMOG').reduce((sum, s) => sum + Number(s.valor), 0);
    const totalSemog = servicos.filter(s => s.empresa === 'SEMOG').reduce((sum, s) => sum + Number(s.valor), 0);

    // Handlers
    const handleCreate = () => {
        openFormModal(
            'Novo Serviço Extra',
            <ServicoExtraForm
                onSuccess={() => { refetch(); closeModal(); }}
                create={create}
                update={(id, data) => update({ id, data })}
            />
        );
    };

    const handleEdit = (service: ServicoExtra) => {
        openFormModal(
            'Editar Serviço Extra',
            <ServicoExtraForm
                initialData={service}
                onSuccess={() => { refetch(); closeModal(); }}
                create={create}
                update={(id, data) => update({ id, data })}
            />
        );
    };

    const handleViewDetails = (group: typeof groupedData[0]) => {
        openViewModal(
            `Extrato: ${group.funcionario_nome}`,
            <ServicoExtraDetails
                employeeName={group.funcionario_nome}
                services={group.items}
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
            render: (item: typeof groupedData[0]) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.empresa === 'FEMOG' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                    {item.empresa}
                </span>
            )
        },
        {
            header: 'Total Horas',
            key: 'total_horas',
            render: (item: typeof groupedData[0]) => (
                <div className="text-gray-700">{item.total_horas.toFixed(2)}h</div>
            )
        },
        {
            header: 'Valor Total',
            key: 'total_valor',
            render: (item: typeof groupedData[0]) => (
                <div className="font-bold text-gray-900">
                    R$ {item.total_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Serviços Extras"
                subtitle="Gestão de serviços extras e cálculos de horas."
                action={
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <input
                            type="month"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                            value={competencia}
                            onChange={(e) => setCompetencia(e.target.value)}
                        />
                        <button
                            onClick={handleCreate}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
                        >
                            <Plus size={20} />
                            Novo Lançamento
                        </button>
                    </div>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Valor Total" value={`R$ ${totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} type="total" />
                <StatCard title="Total FEMOG" value={`R$ ${totalFemog.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} type="info" />
                <StatCard title="Total SEMOG" value={`R$ ${totalSemog.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} type="warning" />
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm">
                <div className="relative w-full">
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

            <ResponsiveTable
                data={filteredGroups}
                columns={columns}
                onRowClick={handleViewDetails}
                emptyMessage="Nenhum registro encontrado para o período."
                keyExtractor={(item) => item.id}
                loading={isLoading}
                getRowBorderColor={(item) => item.empresa === 'FEMOG' ? 'border-blue-500' : 'border-orange-500'}
                renderCard={(item) => (
                    <div className={`flex flex-col gap-2 relative border-l-4 pl-3 ${item.empresa === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-800">{item.funcionario_nome}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.empresa === 'FEMOG' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                {item.empresa}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500 mt-1">
                            <span>Horas: {item.total_horas.toFixed(2)}h</span>
                            <span className="font-bold text-gray-900">R$ {item.total_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                )}
            />
        </div>
    );
};

export default ServicosExtras;
