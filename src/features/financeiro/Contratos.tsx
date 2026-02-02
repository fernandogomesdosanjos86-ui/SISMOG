import { useEffect, useState } from 'react';

import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import StatusBadge from '../../components/StatusBadge';
import CompanyBadge from '../../components/CompanyBadge';
import type { Contrato } from '../../features/financeiro/types';
import { financeiroService } from '../../services/financeiroService';
import { useModal } from '../../context/ModalContext';
import ContratoForm from '../../features/financeiro/components/ContratoForm';
import { Plus, Search, FileText, AlertTriangle, AlertCircle } from 'lucide-react';

const Contratos: React.FC = () => {
    const { openViewModal, openFormModal, openConfirmModal, showFeedback } = useModal();
    const [contratos, setContratos] = useState<Contrato[]>([]);
    const [loading, setLoading] = useState(true);
    const [companyFilter, setCompanyFilter] = useState<'TODOS' | 'SEMOG' | 'FEMOG'>('TODOS');
    const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ativo' | 'inativo'>('TODOS');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchContratos = async () => {
        try {
            setLoading(true);
            const data = await financeiroService.getContratos();
            // Default sort: Alphabetical by Contratante
            const sortedData = (data || []).sort((a, b) => a.contratante.localeCompare(b.contratante));
            setContratos(sortedData);
        } catch (error) {
            console.error(error);
            showFeedback('error', 'Erro ao carregar contratos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContratos();
    }, []);

    const handleCreate = () => {
        openFormModal(
            'Novo Contrato',
            <ContratoForm onSuccess={fetchContratos} />
        );
    };

    const handleView = (contrato: Contrato) => {
        openViewModal(
            `Contrato: ${contrato.contratante}`,
            <ContratoDetails contrato={contrato} />,
            {
                canEdit: true,
                canDelete: true,
                onEdit: () => {
                    openFormModal(
                        `Editar Contrato: ${contrato.contratante}`,
                        <ContratoForm initialData={contrato} onSuccess={fetchContratos} />
                    );
                },
                onDelete: () => {
                    openConfirmModal(
                        'Excluir Contrato',
                        `Tem certeza que deseja excluir o contrato de "${contrato.contratante}"?`,
                        async () => {
                            try {
                                await financeiroService.deleteContrato(contrato.id);
                                showFeedback('success', 'Contrato excluído com sucesso!');
                                fetchContratos();
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
        const searchLower = searchTerm.toLowerCase();
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
            render: (item: Contrato) => `R$ ${item.valor_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
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
        <div className="p-6 space-y-6">
            <PageHeader
                title="Contratos"
                subtitle="Gestão de Contratos de Serviços"
                action={<PrimaryButton onClick={handleCreate}><Plus size={20} className="mr-2" />Novo Contrato</PrimaryButton>}
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
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
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
                <div className="flex items-center gap-2 min-w-fit">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <select
                        className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="TODOS">Todos</option>
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
                            <span className="text-blue-600 font-medium">R$ {item.valor_mensal.toLocaleString('pt-BR')}</span>
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

            {loading && (
                <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}
        </div>
    );
};

// Details Component
const ContratoDetails: React.FC<{ contrato: Contrato }> = ({ contrato }) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
            <div>
                <h3 className="text-lg font-bold text-gray-900">{contrato.contratante}</h3>
                <p className="text-sm text-gray-500">{contrato.nome_posto}</p>
            </div>
            <CompanyBadge company={contrato.empresa} />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <StatusBadge active={contrato.status === 'ativo'} />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">Valor Mensal</p>
                <span className="text-lg font-semibold text-green-700">R$ {contrato.valor_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">Início</p>
                <p className="text-gray-900">{new Date(contrato.data_inicio).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">Duração</p>
                <p className="text-gray-900">{contrato.duracao_meses} meses</p>
            </div>
        </div>

        <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Detalhes Financeiros</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Dia Faturamento:</span>
                    <span>{contrato.dia_faturamento}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Dia Vencimento:</span>
                    <span>{contrato.dia_vencimento}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Vence no mês:</span>
                    <span>{contrato.vencimento_mes_corrente ? 'Sim' : 'Não'}</span>
                </div>
            </div>
        </div>

        {/* Retentions View */}
        {(contrato.retencao_iss || contrato.retencao_pis || contrato.retencao_cofins || contrato.retencao_csll || contrato.retencao_irpj || contrato.retencao_inss) && (
            <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Retenções</h4>
                <div className="flex flex-wrap gap-2">
                    {contrato.retencao_iss && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">ISS ({contrato.perc_iss}%)</span>}
                    {contrato.retencao_pis && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">PIS</span>}
                    {contrato.retencao_cofins && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">COFINS</span>}
                    {contrato.retencao_csll && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">CSLL</span>}
                    {contrato.retencao_irpj && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">IRPJ</span>}
                    {contrato.retencao_inss && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">INSS</span>}
                </div>
            </div>
        )}
    </div>
);

export default Contratos;
