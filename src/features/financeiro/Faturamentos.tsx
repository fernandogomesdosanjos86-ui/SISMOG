import { useEffect, useState, type FC } from 'react';


import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import StatusBadge from '../../components/StatusBadge';
import CompanyBadge from '../../components/CompanyBadge';
import type { Faturamento } from '../../features/financeiro/types';
import { financeiroService } from '../../services/financeiroService';
import { useModal } from '../../context/ModalContext';
import FaturamentoForm from '../../features/financeiro/components/FaturamentoForm';
import { FileText, Play, Eye, Search, CheckCircle, AlertCircle } from 'lucide-react';

const Faturamentos: FC = () => {

    const [faturamentos, setFaturamentos] = useState<Faturamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [competenciaFilter, setCompetenciaFilter] = useState(new Date().toISOString().substring(0, 7) + '-01'); // YYYY-MM-01
    const [companyFilter, setCompanyFilter] = useState<'TODOS' | 'SEMOG' | 'FEMOG'>('TODOS');
    const [statusFilter, setStatusFilter] = useState<'TODOS' | 'pendente' | 'emitido'>('TODOS');
    const [searchTerm, setSearchTerm] = useState('');
    const { openFormModal, openViewModal, openConfirmModal, showFeedback, closeModal } = useModal();

    const fetchFaturamentos = async (month: string) => {
        try {
            setLoading(true);
            const data = await financeiroService.getFaturamentos(month);
            setFaturamentos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFaturamentos(competenciaFilter);
    }, [competenciaFilter]);

    const handleGerar = () => {
        openConfirmModal(
            'Gerar Faturamentos',
            `Deseja gerar os faturamentos para a competência ${new Date(competenciaFilter).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}?`,
            async () => {
                try {
                    const gerados = await financeiroService.generateFaturamentos(competenciaFilter);
                    showFeedback('success', `${gerados.length} faturamentos gerados.`);
                    fetchFaturamentos(competenciaFilter);
                } catch (error) {
                    console.error(error);
                    showFeedback('error', 'Erro ao gerar faturamentos.');
                }
            }
        );
    };

    // Details Component
    const FaturamentoDetails: FC<{ faturamento: Faturamento }> = ({ faturamento }) => (

        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <div className="mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full uppercase font-bold tracking-wide ${faturamento.status === 'emitido' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {faturamento.status}
                        </span>
                    </div>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Contratante</p>
                    <p className="text-base text-gray-900">{faturamento.contratos?.contratante}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Competência</p>
                    <p className="text-base text-gray-900 font-mono">
                        {new Date(faturamento.competencia + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Valor Líquido</p>
                    <p className="text-base font-bold text-green-700">R$ {faturamento.valor_liquido?.toLocaleString('pt-BR')}</p>
                </div>
            </div>

            {faturamento.status === 'emitido' && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText size={16} className="text-gray-500" />
                        <span className="font-semibold text-gray-700">Nota Fiscal Emitida</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <p><span className="text-gray-500">Número:</span> {faturamento.numero_nf}</p>
                        <p><span className="text-gray-500">Emissão:</span> {faturamento.data_emissao ? new Date(faturamento.data_emissao).toLocaleDateString() : '-'}</p>
                    </div>
                </div>
            )}

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Detalhamento</h4>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Valor Bruto:</span>
                        <span>R$ {faturamento.valor_bruto.toLocaleString('pt-BR')}</span>
                    </div>
                    {(faturamento.acrescimo || 0) > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>+ Acréscimos:</span>
                            <span>R$ {faturamento.acrescimo.toLocaleString('pt-BR')}</span>
                        </div>
                    )}
                    {/* Detailed Retentions */}
                    {(faturamento.valor_retencao_pis || 0) > 0 && (
                        <div className="flex justify-between text-gray-600">
                            <span>- PIS ({faturamento.retencao_pis ? 'Sim' : 'Não'}):</span>
                            <span>R$ {faturamento.valor_retencao_pis.toLocaleString('pt-BR')}</span>
                        </div>
                    )}
                    {(faturamento.valor_retencao_cofins || 0) > 0 && (
                        <div className="flex justify-between text-gray-600">
                            <span>- COFINS ({faturamento.retencao_cofins ? 'Sim' : 'Não'}):</span>
                            <span>R$ {faturamento.valor_retencao_cofins.toLocaleString('pt-BR')}</span>
                        </div>
                    )}
                    {(faturamento.valor_retencao_irpj || 0) > 0 && (
                        <div className="flex justify-between text-gray-600">
                            <span>- IRPJ ({faturamento.retencao_irpj ? 'Sim' : 'Não'}):</span>
                            <span>R$ {faturamento.valor_retencao_irpj.toLocaleString('pt-BR')}</span>
                        </div>
                    )}
                    {(faturamento.valor_retencao_csll || 0) > 0 && (
                        <div className="flex justify-between text-gray-600">
                            <span>- CSLL ({faturamento.retencao_csll ? 'Sim' : 'Não'}):</span>
                            <span>R$ {faturamento.valor_retencao_csll.toLocaleString('pt-BR')}</span>
                        </div>
                    )}
                    {(faturamento.valor_retencao_inss || 0) > 0 && (
                        <div className="flex justify-between text-gray-600">
                            <span>- INSS ({faturamento.retencao_inss ? 'Sim' : 'Não'}):</span>
                            <span>R$ {faturamento.valor_retencao_inss.toLocaleString('pt-BR')}</span>
                        </div>
                    )}
                    {(faturamento.valor_retencao_iss || 0) > 0 && (
                        <div className="flex justify-between text-gray-600">
                            <span>- ISS ({faturamento.perc_iss}%):</span>
                            <span>R$ {faturamento.valor_retencao_iss.toLocaleString('pt-BR')}</span>
                        </div>
                    )}
                    {(faturamento.valor_retencao_caucao || 0) > 0 && (
                        <div className="flex justify-between text-orange-600">
                            <span>- Caução ({faturamento.perc_retencao_caucao}%):</span>
                            <span>R$ {(faturamento.valor_retencao_caucao || 0).toLocaleString('pt-BR')}</span>

                        </div>
                    )}
                    {/* Simplified retentions display for brevity */}
                    <div className="flex justify-between border-t border-gray-200 pt-1 font-medium">
                        <span>Líquido:</span>
                        <span>R$ {faturamento.valor_liquido.toLocaleString('pt-BR')}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    // ... inside Faturamentos component logic
    const handleView = (item: Faturamento) => {
        const isEmitido = item.status === 'emitido';

        openViewModal(
            `Faturamento: ${item.contratos?.contratante}`,
            <FaturamentoDetails faturamento={item} />,
            {
                canEdit: !isEmitido,
                canDelete: true, // Actually "Desfazer"/Undo
                editText: 'Editar',
                deleteText: isEmitido ? 'Desfazer Emissão' : 'Excluir',
                onEdit: isEmitido ? undefined : () => {
                    openFormModal(
                        'Editar Faturamento',
                        <FaturamentoForm initialData={item} onSuccess={() => fetchFaturamentos(competenciaFilter)} />
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
                                    await financeiroService.desfazerFaturamento(item.id);
                                } else {
                                    await financeiroService.deleteFaturamento(item.id);
                                }
                                showFeedback('success', 'Operação realizada com sucesso!');
                                fetchFaturamentos(competenciaFilter);
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
                    <p className="text-sm text-gray-500">Valor Líquido: R$ {item.valor_liquido.toLocaleString('pt-BR')}</p>
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
                                    await financeiroService.emitirNota(item.id, numeroNf);
                                    showFeedback('success', 'Nota emitida e recebimento gerado!');
                                    closeModal();
                                    fetchFaturamentos(competenciaFilter);
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
            render: (i: Faturamento) => `R$ ${i.valor_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        },
        {
            key: 'valor_liquido',
            header: 'Faturamento Líquido',
            render: (i: Faturamento) => <span className="font-bold text-green-700">R$ {i.valor_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
        const searchLower = searchTerm.toLowerCase();
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
        <div className="p-6 space-y-6">
            <PageHeader
                title="Faturamentos"
                subtitle="Gestão de Faturamentos Mensais"
                action={
                    <div className="flex gap-2">
                        <input
                            type="month"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={competenciaFilter.substring(0, 7)}
                            onChange={(e) => setCompetenciaFilter(e.target.value + '-01')}
                        />
                        <PrimaryButton onClick={handleGerar}>
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
                        <p className="text-2xl font-bold text-gray-800">R$ {totalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-yellow-600 font-medium">Pendente Bruto</p>
                        <p className="text-2xl font-bold text-gray-800">R$ {totalPendenteBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
                        <AlertCircle size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-green-600 font-medium">Emitido Bruto</p>
                        <p className="text-2xl font-bold text-gray-800">R$ {totalEmitidoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <CheckCircle size={24} />
                    </div>
                </div>
            </div>

            {/* Filters - Top Bar (Search + Competencia) */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
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
                <div className="flex items-center gap-2 min-w-fit">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <select
                        className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="TODOS">Todos</option>
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
                        <p className="text-sm text-gray-600">Venc: {item.data_vencimento ? new Date(item.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</p>
                        <div className="flex justify-between items-center border-t pt-2 mt-2">
                            <span className="text-green-700 font-bold">R$ {item.valor_liquido.toLocaleString('pt-BR')}</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleView(item); }}
                                className="p-2 text-blue-600"
                            >
                                <Eye size={20} />
                            </button>
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

export default Faturamentos;
