import { useState } from 'react';

import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import StatusBadge from '../../components/StatusBadge';
import CompanyBadge from '../../components/CompanyBadge';
import type { Recebimento } from '../../features/financeiro/types';
import { useModal } from '../../context/ModalContext';
import RecebimentoAvulsoForm from '../../features/financeiro/components/RecebimentoAvulsoForm';
import RecebimentoDetails from '../../features/financeiro/components/RecebimentoDetails';
import { Plus, Search, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { useRecebimentos } from './hooks/useRecebimentos';

const Recebimentos: React.FC = () => {
    const [competenciaFilter, setCompetenciaFilter] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
    const [companyFilter, setCompanyFilter] = useState<'TODOS' | 'SEMOG' | 'FEMOG'>('TODOS');
    const [statusFilter, setStatusFilter] = useState<'TODOS' | 'pendente' | 'recebido'>('TODOS');
    const [searchTerm, setSearchTerm] = useState('');
    const { openFormModal, openConfirmModal, openViewModal, showFeedback } = useModal();

    const { recebimentos, isLoading, refetch, register, delete: deleteRecebimento } = useRecebimentos();

    // Filter Logic
    const filteredRecebimentos = recebimentos.filter(r => {
        // Date Check (Competence)
        const dateDate = r.data_recebimento || r.faturamentos?.data_vencimento;
        const matchesCompetence = dateDate ? dateDate.startsWith(competenciaFilter) : true;

        // Other Filters
        const matchesCompany = companyFilter === 'TODOS' || r.empresa === companyFilter;
        const matchesStatus = statusFilter === 'TODOS' || r.status === statusFilter;
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (r.descricao || '').toLowerCase().includes(searchLower) ||
            (r.empresa || '').toLowerCase().includes(searchLower) ||
            (r.faturamentos?.contratos?.contratante || '').toLowerCase().includes(searchLower);

        return matchesCompetence && matchesCompany && matchesStatus && matchesSearch;
    }).sort((a, b) => {
        const dateA = a.data_recebimento || a.faturamentos?.data_vencimento || '';
        const dateB = b.data_recebimento || b.faturamentos?.data_vencimento || '';
        return new Date(dateA).getTime() - new Date(dateB).getTime();
    });

    // KPI Calculations
    const totalLiquido = filteredRecebimentos.reduce((acc, curr) => acc + Number(curr.valor_recebimento_liquido), 0);
    const totalPendente = filteredRecebimentos.filter(r => r.status === 'pendente').reduce((acc, curr) => acc + Number(curr.valor_recebimento_liquido), 0);
    const totalRecebido = filteredRecebimentos.filter(r => r.status === 'recebido').reduce((acc, curr) => acc + Number(curr.valor_recebimento_liquido), 0);

    const handleCreateAvulso = () => {
        openFormModal(
            'Novo Recebimento Avulso',
            <RecebimentoAvulsoForm onSuccess={refetch} />
        );
    };

    const handleRegistrar = (item: Recebimento) => {
        openConfirmModal(
            'Registrar Recebimento',
            `Confirma o recebimento de ${formatCurrency(item.valor_recebimento_liquido)}? A ação não pode ser desfeita.`,
            async () => {
                try {
                    await register(item.id);
                    showFeedback('success', 'Recebimento registrado com sucesso!');
                } catch (error) {
                    console.error(error);
                    showFeedback('error', 'Erro ao registrar recebimento.');
                }
            }
        );
    };

    // handleView logic
    const handleView = (item: Recebimento) => {
        const isRecebido = item.status === 'recebido';

        openViewModal(
            'Detalhes do Recebimento',
            <RecebimentoDetails recebimento={item} />,
            {
                canEdit: item.status === 'pendente',
                editText: 'Editar',
                onEdit: item.status === 'pendente' ? () => openFormModal('Editar Recebimento', <RecebimentoAvulsoForm initialData={item} onSuccess={refetch} />) : undefined,
                canDelete: true,
                deleteText: 'Excluir',
                onDelete: async () => {
                    openConfirmModal(
                        'Excluir Recebimento',
                        'Deseja excluir este recebimento? Ação irreversível.',
                        async () => {
                            try {
                                await deleteRecebimento(item.id);
                                showFeedback('success', 'Recebimento excluído com sucesso!');
                            } catch (e) {
                                console.error(e);
                                showFeedback('error', 'Erro ao excluir recebimento.');
                            }
                        }
                    );
                },
                extraActions: [
                    ...(!isRecebido ? [{
                        label: 'Recebimento',
                        onClick: () => handleRegistrar(item),
                        variant: 'primary' as const,
                    }] : [])
                ]
            }

        );
    }

    const columns = [
        {
            key: 'data_recebimento',
            header: 'Data',
            render: (i: Recebimento) => i.data_recebimento ? new Date(i.data_recebimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'
        },
        {
            key: 'descricao_posto',
            header: 'Descrição / Posto',
            render: (i: Recebimento) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm text-gray-900">
                        {i.tipo === 'faturamento'
                            ? (i.faturamentos?.contratos?.nome_posto || i.faturamentos?.contratos?.contratante || '-')
                            : i.descricao}
                    </span>
                    {i.tipo === 'faturamento' && i.faturamentos?.contratos?.nome_posto && (
                        <span className="text-[10px] text-gray-500">{i.faturamentos.contratos.contratante}</span>
                    )}
                </div>
            )
        },
        {
            key: 'tipo',
            header: 'Tipo',
            render: (i: Recebimento) => (
                <span className="text-xs font-medium text-gray-600 capitalize bg-gray-100 px-2 py-1 rounded-full">{i.tipo}</span>
            )
        },
        {
            key: 'empresa',
            header: 'Empresa',
            render: (i: Recebimento) => <CompanyBadge company={i.empresa as any} />
        },
        {
            key: 'valor',
            header: 'Valor',
            render: (i: Recebimento) => <span className="font-bold text-green-700">{formatCurrency(i.valor_recebimento_liquido)}</span>
        },
        {
            key: 'status',
            header: 'Status',
            render: (i: Recebimento) => <StatusBadge active={i.status === 'recebido'} activeLabel="Recebido" inactiveLabel="Pendente" />
        }
    ];

    return (
        <div className="space-y-6">

            <PageHeader
                title="Recebimentos"
                subtitle="Gestão de Recebimentos e Baixas"
                action={
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <input
                            type="month"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                            value={competenciaFilter}
                            onChange={(e) => setCompetenciaFilter(e.target.value)}
                        />
                        <PrimaryButton onClick={handleCreateAvulso} className="w-full sm:w-auto justify-center">
                            <Plus size={16} className="mr-2" />
                            Novo Avulso
                        </PrimaryButton>
                    </div>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Previsto</p>
                        <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalLiquido)}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-yellow-600 font-medium">Pendente</p>
                        <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalPendente)}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
                        <AlertCircle size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-green-600 font-medium">Recebido</p>
                        <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalRecebido)}</p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <CheckCircle size={24} />
                    </div>
                </div>
            </div>

            {/* Filters - Top Bar (Search + Status) */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por descrição, empresa ou contratante..."
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
                        <option value="pendente">Pendentes</option>
                        <option value="recebido">Recebidos</option>
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
                data={filteredRecebimentos}
                columns={columns}
                keyExtractor={(item) => item.id}
                getRowBorderColor={(item) => {
                    const empresa = item.empresa || item.faturamentos?.contratos?.empresa;
                    return empresa === 'FEMOG' ? 'border-blue-500' : 'border-orange-500';
                }}
                onRowClick={handleView}
                renderCard={(item) => (
                    <div className={`flex flex-col gap-2 relative border-l-4 pl-3 ${(item.empresa || item.faturamentos?.contratos?.empresa) === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-800">{item.tipo === 'faturamento' ? item.faturamentos?.contratos?.contratante : item.descricao}</span>
                            <StatusBadge active={item.status === 'recebido'} activeLabel="Recebido" inactiveLabel="Pendente" />
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                            <CompanyBadge company={(item.empresa || item.faturamentos?.contratos?.empresa) as any} />
                            <span>{item.data_recebimento ? new Date(item.data_recebimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : (item.faturamentos?.data_vencimento ? new Date(item.faturamentos.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-')}</span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2 mt-2">
                            <span className="text-green-700 font-bold">{formatCurrency(item.valor_recebimento_liquido)}</span>
                        </div>
                    </div>
                )}
            />

            {
                isLoading && (
                    <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )
            }
        </div >
    );
};

export default Recebimentos;
