import { useState, type FC } from 'react';

import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import StatusBadge from '../../components/StatusBadge';
import CompanyBadge from '../../components/CompanyBadge';
import type { Faturamento } from '../../features/financeiro/types';
import { useModal } from '../../context/ModalContext';
import FaturamentoForm from '../../features/financeiro/components/FaturamentoForm';
import FaturamentoDetails from '../../features/financeiro/components/FaturamentoDetails';
import { FileText, Play, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { useDebounce } from '../../hooks/useDebounce';
import { useFaturamentos } from './hooks/useFaturamentos';


const Faturamentos: FC = () => {

    const [competenciaFilter, setCompetenciaFilter] = useState(new Date().toISOString().substring(0, 7) + '-01'); // YYYY-MM-01
    const [companyFilter, setCompanyFilter] = useState<'TODOS' | 'SEMOG' | 'FEMOG'>('TODOS');
    const [statusFilter, setStatusFilter] = useState<'TODOS' | 'pendente' | 'emitido'>('TODOS');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const { openFormModal, openViewModal, openConfirmModal, showFeedback, closeModal } = useModal();

    const { faturamentos, isLoading, refetch, generate, delete: deleteFaturamento, undoEmission, emit } = useFaturamentos(competenciaFilter);

    const handleGerar = () => {
        openConfirmModal(
            'Gerar Faturamentos',
            `Deseja gerar os faturamentos para a competência ${new Date(competenciaFilter).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}?`,
            async () => {
                try {
                    const gerados = await generate(competenciaFilter);
                    showFeedback('success', `${gerados.length} faturamentos gerados.`);
                } catch (error) {
                    console.error(error);
                    showFeedback('error', 'Erro ao gerar faturamentos.');
                }
            }
        );
    };

    // handleView logic
    const handleView = (item: Faturamento) => {
        const isEmitido = item.status === 'emitido';

        openViewModal(
            'Detalhes do Faturamento',
            <FaturamentoDetails faturamento={item} />,
            {
                canEdit: !isEmitido,
                canDelete: true, // Actually "Desfazer"/Undo
                editText: 'Editar',
                deleteText: isEmitido ? 'Desfazer Emissão' : 'Excluir',
                onEdit: isEmitido ? undefined : () => {
                    openFormModal(
                        'Editar Faturamento',
                        <FaturamentoForm initialData={item} onSuccess={refetch} />
                    );
                },
                onDelete: async () => {
                    const actionName = isEmitido ? 'Desfazer Emissão' : 'Excluir Faturamento';
                    const confirmMsg = isEmitido
                        ? 'Deseja desfazer a emissão deste faturamento? O recebimento vinculado será excluído.'
                        : 'Deseja excluir este faturamento? Esta ação não pode ser desfeita.';

                    openConfirmModal(
                        actionName,
                        confirmMsg,
                        async () => {
                            try {
                                if (isEmitido) {
                                    await undoEmission(item.id);
                                } else {
                                    await deleteFaturamento(item.id);
                                }
                                showFeedback('success', 'Operação realizada com sucesso!');
                            } catch (e) {
                                console.error(e);
                                showFeedback('error', 'Erro ao processar solicitação.');
                            }
                        }
                    );
                },
                // Custom extra action for emission
                extraActions: !isEmitido ? [
                    {
                        label: 'Emitir Nota',
                        // icon: <FileText size={16} />,
                        onClick: () => handleEmitirLogic(item),
                        variant: 'primary'
                    }
                ] : []
            }
        );
    };

    const handleEmitirLogic = (item: Faturamento) => {
        let numeroNf = '';
        openFormModal(
            'Emitir Nota Fiscal',
            (
                <div className="space-y-4">
                    <p>Confirma a emissão da nota para <strong>{item.contratos?.contratante}</strong>?</p>
                    <p className="text-sm text-gray-500">Valor Líquido: {formatCurrency(item.valor_liquido)}</p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Número da NF</label>
                        <input
                            autoFocus
                            type="text"
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            onChange={(e) => numeroNf = e.target.value}
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button
                            onClick={async () => {
                                if (!numeroNf) return showFeedback('error', 'Informe o número da NF');
                                try {
                                    await emit({ id: item.id, nfNumber: numeroNf });
                                    showFeedback('success', 'Nota emitida e recebimento gerado!');
                                    closeModal();
                                } catch (e) {
                                    console.error(e);
                                    showFeedback('error', 'Erro ao emitir nota');
                                }
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                            Confirmar Emissão
                        </button>
                    </div>
                </div>
            )
        );
    }



    const columns = [
        {
            key: 'data_emissao',
            header: 'Emissão',
            render: (i: Faturamento) => i.data_emissao ? new Date(i.data_emissao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'
        },
        {
            key: 'nome_posto',
            header: 'Posto',
            render: (i: Faturamento) => i.contratos?.nome_posto || '-'
        },
        {
            key: 'empresa',
            header: 'Empresa',
            render: (i: Faturamento) => i.contratos?.empresa ? <CompanyBadge company={i.contratos.empresa} /> : '-'
        },
        {
            key: 'valor_bruto',
            header: 'Fat. Bruto',
            render: (i: Faturamento) => formatCurrency(i.valor_bruto)
        },
        {
            key: 'valor_liquido',
            header: 'Faturamento Líquido',
            render: (i: Faturamento) => <span className="font-bold text-green-700">{formatCurrency(i.valor_liquido)}</span>
        },
        {
            key: 'status',
            header: 'Status',
            render: (i: Faturamento) => <StatusBadge active={i.status === 'emitido'} activeLabel="Emitido" inactiveLabel="Pendente" />
        }
    ];

    // Filter Logic
    // Filter Logic
    const filteredFaturamentos = faturamentos.filter(f => {
        const matchesCompany = companyFilter === 'TODOS' || f.contratos?.empresa === companyFilter;
        const matchesStatus = statusFilter === 'TODOS' || f.status === statusFilter;
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch = (f.contratos?.contratante || '').toLowerCase().includes(searchLower) ||
            (f.contratos?.nome_posto || '').toLowerCase().includes(searchLower);
        return matchesCompany && matchesStatus && matchesSearch;
    }).sort((a, b) => {
        if (!a.data_vencimento) return 1;
        if (!b.data_vencimento) return -1;
        return new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime();
    });

    // KPI Calculations
    const totalBruto = filteredFaturamentos.reduce((acc, curr) => acc + Number(curr.valor_bruto), 0);
    const totalPendenteBruto = filteredFaturamentos.filter(f => f.status === 'pendente').reduce((acc, curr) => acc + Number(curr.valor_bruto), 0);
    const totalEmitidoBruto = filteredFaturamentos.filter(f => f.status === 'emitido').reduce((acc, curr) => acc + Number(curr.valor_bruto), 0);

    return (
        <div className="space-y-6">

            <PageHeader
                title="Faturamentos"
                subtitle="Gestão de Faturamentos Mensais"
                action={
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <input
                            type="month"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                            value={competenciaFilter.substring(0, 7)}
                            onChange={(e) => setCompetenciaFilter(e.target.value + '-01')}
                        />
                        <PrimaryButton onClick={handleGerar} className="w-full sm:w-auto justify-center">
                            <Play size={16} className="mr-2" />
                            Gerar Mês
                        </PrimaryButton>
                    </div>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Bruto</p>
                        <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalBruto)}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-yellow-600 font-medium">Pendente Bruto</p>
                        <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalPendenteBruto)}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
                        <AlertCircle size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-green-600 font-medium">Emitido Bruto</p>
                        <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalEmitidoBruto)}</p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <CheckCircle size={24} />
                    </div>
                </div>
            </div>

            {/* Filters - Top Bar (Search + Competencia) */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por contratante ou posto..."
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
                        <option value="emitido">Emitidos</option>
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
                data={filteredFaturamentos}
                columns={columns}
                keyExtractor={(item) => item.id}
                getRowBorderColor={(item) => item.contratos?.empresa === 'FEMOG' ? 'border-blue-500' : 'border-orange-500'}
                onRowClick={handleView}
                renderCard={(item) => (
                    <div className={`flex flex-col gap-2 relative border-l-4 pl-3 ${item.contratos?.empresa === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-800">{item.contratos?.contratante}</span>
                            <StatusBadge active={item.status === 'emitido'} activeLabel="Emitido" inactiveLabel="Pendente" />
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                            <CompanyBadge company={item.contratos?.empresa as any} />
                            <span>Emissão: {item.data_emissao ? new Date(item.data_emissao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</span>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2 mt-2">
                            <span className="text-green-700 font-bold">{formatCurrency(item.valor_liquido)}</span>

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

export default Faturamentos;
