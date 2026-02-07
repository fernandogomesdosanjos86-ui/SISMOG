import { useState } from 'react';

import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import StatusBadge from '../../components/StatusBadge';
import CompanyBadge from '../../components/CompanyBadge';
import type { Contrato } from '../../features/financeiro/types';
import { useModal } from '../../context/ModalContext';
import ContratoForm from '../../features/financeiro/components/ContratoForm';
import ContratoDetails from '../../features/financeiro/components/ContratoDetails';
import { Plus, Search, FileText, AlertTriangle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { useDebounce } from '../../hooks/useDebounce';
import { useContratos } from './hooks/useContratos';

const Contratos: React.FC = () => {
    const { openViewModal, openFormModal, openConfirmModal, showFeedback } = useModal();
    const { contratos, isLoading, refetch, delete: deleteContrato } = useContratos();
    const [companyFilter, setCompanyFilter] = useState<'TODOS' | 'SEMOG' | 'FEMOG'>('TODOS');
    const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ativo' | 'inativo'>('TODOS');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);

    const handleCreate = () => {
        openFormModal(
            'Novo Contrato',
            <ContratoForm onSuccess={refetch} />
        );
    };

    const handleView = (contrato: Contrato) => {
        openViewModal(
            'Detalhes do Contrato',
            <ContratoDetails contrato={contrato} />,
            {
                canEdit: true,
                canDelete: true,
                onEdit: () => {
                    openFormModal(
                        'Editar Contrato',
                        <ContratoForm initialData={contrato} onSuccess={refetch} />
                    );
                },
                onDelete: () => {
                    openConfirmModal(
                        'Excluir Contrato',
                        `Tem certeza que deseja excluir o contrato de "${contrato.contratante}"?`,
                        async () => {
                            try {
                                await deleteContrato(contrato.id);
                                showFeedback('success', 'Contrato excluído com sucesso!');
                            } catch (error) {
                                console.error(error);
                                showFeedback('error', 'Erro ao excluir contrato.');
                            }
                        }
                    );
                }
            }
        );
    };

    // Calculations for Cards
    const calculateTerm = (dataInicio: string, duracao: number) => {
        if (!dataInicio) return 0;
        const start = new Date(dataInicio);
        const end = new Date(start);
        end.setMonth(start.getMonth() + duracao);
        const now = new Date();
        // Calculate difference in months
        // Logic: (Year2 - Year1) * 12 + (Month2 - Month1)
        // Check if day is passed? Simplified month diff:
        let months = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());
        // Adjust for days? If today is 20th and exp is 15th, technically standard diff might be same month index but neg days.
        // Let's use simplified approximation for UI or strict logic.
        // User requested "Prazo com a contagem de meses restantes".
        // Using strict time diff in days / 30 for "months"?
        // Or just calendar months?
        // Let's stick to calendar month difference, ensuring < 0 is expired.
        if (now > end) return -1;
        return months < 0 ? 0 : months;
    };

    // Filter Logic for List
    const filteredContratos = contratos.filter(c => {
        const matchesCompany = companyFilter === 'TODOS' || c.empresa === companyFilter;
        const matchesStatus = statusFilter === 'TODOS' || c.status === statusFilter;
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch = c.contratante.toLowerCase().includes(searchLower) ||
            c.nome_posto.toLowerCase().includes(searchLower);
        return matchesCompany && matchesStatus && matchesSearch;
    });

    // KPI Calculations (Based on Company Filter, ignoring text search for broader context or strictly following "info follows tabs"?)
    // User said "info follows tabs", so we filter by company only.
    const kpiData = contratos.filter(c => companyFilter === 'TODOS' || c.empresa === companyFilter);

    const activeContracts = kpiData.filter(c => c.status === 'ativo').length;
    const warningContracts = kpiData.filter(c => {
        if (c.status !== 'ativo') return false;
        const remaining = calculateTerm(c.data_inicio, c.duracao_meses);
        return remaining > 1 && remaining <= 3;
    }).length;
    const criticalContracts = kpiData.filter(c => {
        if (c.status !== 'ativo') return false;
        const remaining = calculateTerm(c.data_inicio, c.duracao_meses);
        return remaining <= 1;
    }).length;

    const columns = [
        {
            key: 'contratante',
            header: 'Contratante',
            render: (item: Contrato) => <span className="font-semibold text-gray-800">{item.contratante}</span>
        },
        {
            key: 'nome_posto',
            header: 'Posto',
            render: (item: Contrato) => item.nome_posto
        },
        {
            key: 'empresa',
            header: 'Empresa',
            render: (item: Contrato) => <CompanyBadge company={item.empresa} />
        },
        {
            key: 'valor_mensal',
            header: 'Valor',
            render: (item: Contrato) => formatCurrency(item.valor_mensal)
        },
        {
            key: 'prazo',
            header: 'Prazo',
            render: (item: Contrato) => {
                const remaining = calculateTerm(item.data_inicio, item.duracao_meses);
                let colorClass = 'text-green-600';
                if (remaining <= 1) colorClass = 'text-red-600 font-bold';
                else if (remaining <= 3) colorClass = 'text-orange-600 font-bold';

                return <span className={colorClass}>{remaining < 0 ? 'Vencido' : `${remaining} meses`}</span>;
            }
        },
        {
            key: 'status',
            header: 'Status',
            render: (item: Contrato) => <StatusBadge active={item.status === 'ativo'} />
        }
    ];

    return (
        <div className="space-y-6">

            <PageHeader
                title="Contratos"
                subtitle="Gestão de Contratos de Serviços"
                action={<PrimaryButton onClick={handleCreate} className="w-full sm:w-auto justify-center"><Plus size={20} className="mr-2" />Novo Contrato</PrimaryButton>}
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Contratos Ativos</p>
                        <p className="text-3xl font-bold text-gray-800">{activeContracts}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-orange-600 font-medium">Vencimento (3 meses)</p>
                        <p className="text-2xl font-bold text-gray-800">{warningContracts}</p>
                    </div>
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                        <AlertTriangle size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-red-600 font-medium">Vencimento (1 mês)</p>
                        <p className="text-2xl font-bold text-gray-800">{criticalContracts}</p>
                    </div>
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <AlertCircle size={24} />
                    </div>
                </div>
            </div>

            {/* Filters - Top Bar (Search + Status) */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por posto ou empresa..."
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
                {['TODOS', 'SEMOG', 'FEMOG'].map((tab) => (
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
                data={filteredContratos}
                columns={columns}
                keyExtractor={(item) => item.id}
                onRowClick={handleView}
                getRowBorderColor={(item) => item.empresa === 'FEMOG' ? 'border-blue-500' : 'border-orange-500'}
                renderCard={(item) => (
                    <div className={`flex flex-col gap-2 relative border-l-4 pl-3 ${item.empresa === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-800">{item.contratante}</span>
                            <div className="flex gap-2">
                                <CompanyBadge company={item.empresa} />
                                <StatusBadge active={item.status === 'ativo'} />
                            </div>
                        </div>
                        <p className="text-sm text-gray-600">{item.nome_posto}</p>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-blue-600 font-medium">{formatCurrency(item.valor_mensal)}</span>
                            {(() => {
                                const remaining = calculateTerm(item.data_inicio, item.duracao_meses);
                                let colorClass = 'text-green-600';
                                if (remaining <= 1) colorClass = 'text-red-600';
                                else if (remaining <= 3) colorClass = 'text-orange-600';
                                return <span className={`text-xs ${colorClass} font-bold`}>{remaining < 0 ? 'Vencido' : `${remaining} meses`}</span>;
                            })()}
                        </div>
                    </div>
                )}
            />

            {isLoading && (
                <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}
        </div>
    );
};

export default Contratos;
