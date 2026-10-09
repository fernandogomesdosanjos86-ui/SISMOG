import { useState, useMemo, type FC } from 'react';
import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import StatusBadge from '../../components/StatusBadge';
import StatCard from '../../components/StatCard';
import CompanyBadge from '../../components/CompanyBadge';
import FilterTabs from '../../components/ui/FilterTabs';
import { useModal } from '../../context/ModalContext';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { formatCurrency } from '../../utils/format';
import { useContasFinanceiras } from './hooks/useContasFinanceiras';
import type { ContaFinanceira, Empresa, TipoContaFinanceira } from './types';
import ContaFinanceiraForm from './components/ContaFinanceiraForm';
import AjusteSaldoModal from './components/AjusteSaldoModal';
import HistoricoAjustesModal from './components/HistoricoAjustesModal';
import ContaFinanceiraDetails from './components/ContaFinanceiraDetails';
import {
    Landmark,
    Wallet,
    PiggyBank,
    Plus,
    Search,
    ShieldAlert,
    DollarSign
} from 'lucide-react';

const ContasFinanceiras: FC = () => {
    const { user } = useAuth();
    const { openFormModal, openViewModal, openConfirmModal, showFeedback } = useModal();
    const { contas, isLoading, refetch, toggleStatus, deleteConta } = useContasFinanceiras();

    // 1. Verificação de Permissão no Front-End
    const permissao = (user?.user_metadata?.['permissao'] as string)?.toLowerCase();
    const setor = (user?.user_metadata?.['setor'] as string)?.toLowerCase();
    const hasPermission = permissao === 'adm' || (permissao === 'gestor' && (setor === 'financeiro' || setor === 'direção'));

    // Estados de filtros
    const [companyFilter, setCompanyFilter] = useState<'TODOS' | Empresa>('TODOS');
    const [tipoFilter, setTipoFilter] = useState<'TODOS' | TipoContaFinanceira>('TODOS');
    const [statusFilter, setStatusFilter] = useState<'TODOS' | 'ativa' | 'inativa'>('TODOS');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);

    // Contas filtradas por Empresa para os Cards de Resumo
    const contasPorEmpresa = useMemo(() => {
        return contas.filter((c) => {
            if (companyFilter === 'TODOS') return true;
            return c.empresa === companyFilter;
        });
    }, [contas, companyFilter]);

    // Cards de Resumo (Topo)
    const { saldoBancos, saldoCaixa, saldoGeral } = useMemo(() => {
        let bancos = 0;
        let caixa = 0;
        let limite = 0;

        contasPorEmpresa.forEach((c) => {
            const saldo = Number(c.saldo_atual || 0);
            if (c.tipo_conta === 'caixa_fisico') {
                caixa += saldo;
            } else {
                bancos += saldo;
                if (c.tipo_conta === 'corrente') {
                    limite += Number(c.limite_cheque_especial || 0);
                }
            }
        });

        return {
            saldoBancos: bancos,
            saldoCaixa: caixa,
            saldoGeral: bancos + caixa,
            limiteTotalDisponivel: bancos + caixa + limite
        };
    }, [contasPorEmpresa]);

    // Contas filtradas pela listagem final (empresa + tipo + status + busca)
    const filteredContas = useMemo(() => {
        return contasPorEmpresa.filter((c) => {
            const matchesTipo = tipoFilter === 'TODOS' || c.tipo_conta === tipoFilter;
            const matchesStatus = statusFilter === 'TODOS' || c.status === statusFilter;

            const searchLower = debouncedSearch.toLowerCase();
            const matchesSearch =
                (c.nome || '').toLowerCase().includes(searchLower) ||
                (c.agencia || '').toLowerCase().includes(searchLower) ||
                (c.conta || '').toLowerCase().includes(searchLower) ||
                (c.chave_pix || '').toLowerCase().includes(searchLower);

            return matchesTipo && matchesStatus && matchesSearch;
        });
    }, [contasPorEmpresa, tipoFilter, statusFilter, debouncedSearch]);

    // Ações de Modal
    const handleNovaConta = () => {
        openFormModal(
            'Nova Conta Financeira',
            <ContaFinanceiraForm onSuccess={refetch} />
        );
    };

    const handleEditar = (item: ContaFinanceira) => {
        openFormModal(
            'Editar Conta Financeira',
            <ContaFinanceiraForm initialData={item} onSuccess={refetch} />
        );
    };

    const handleAjustarSaldo = (item: ContaFinanceira) => {
        openFormModal(
            `Ajustar Saldo (Conciliação) - ${item.nome}`,
            <AjusteSaldoModal conta={item} onSuccess={refetch} />
        );
    };

    const handleVerHistorico = (item: ContaFinanceira) => {
        openFormModal(
            `Histórico de Conciliações - ${item.nome}`,
            <HistoricoAjustesModal conta={item} />
        );
    };

    const handleToggleStatus = (item: ContaFinanceira) => {
        const novoStatus = item.status === 'ativa' ? 'inativa' : 'ativa';
        const acao = novoStatus === 'ativa' ? 'ativar' : 'inativar';

        openConfirmModal(
            `${acao.charAt(0).toUpperCase() + acao.slice(1)} Conta Financeira`,
            `Deseja realmente ${acao} a conta "${item.nome}"?`,
            async () => {
                try {
                    await toggleStatus({ id: item.id, status: novoStatus });
                    showFeedback('success', `Conta ${item.nome} ${novoStatus === 'ativa' ? 'ativada' : 'inativada'} com sucesso!`);
                } catch (err: any) {
                    console.error(err);
                    showFeedback('error', 'Erro ao alterar status da conta.');
                }
            }
        );
    };

    const handleExcluir = (item: ContaFinanceira) => {
        openConfirmModal(
            'Excluir Conta Financeira',
            `Deseja excluir permanentemente a conta "${item.nome}"? Esta ação removerá o histórico de conciliações vinculado.`,
            async () => {
                try {
                    await deleteConta(item.id);
                    showFeedback('success', `Conta ${item.nome} excluída com sucesso!`);
                } catch (err: any) {
                    console.error(err);
                    showFeedback('error', 'Erro ao excluir conta.');
                }
            }
        );
    };

    const handleView = (item: ContaFinanceira) => {
        openViewModal(
            'Detalhes da Conta Financeira',
            <ContaFinanceiraDetails conta={item} />,
            {
                canEdit: true,
                editText: 'Editar',
                onEdit: () => handleEditar(item),
                canDelete: true,
                deleteText: item.status === 'ativa' ? 'Inativar' : 'Ativar',
                onDelete: () => handleToggleStatus(item),
                extraActions: [
                    {
                        label: 'Ajustar Saldo',
                        onClick: () => handleAjustarSaldo(item),
                        variant: 'primary'
                    },
                    {
                        label: 'Histórico',
                        onClick: () => handleVerHistorico(item),
                        variant: 'secondary'
                    },
                    {
                        label: 'Excluir',
                        onClick: () => handleExcluir(item),
                        variant: 'danger'
                    }
                ]
            }
        );
    };

    // Colunas da Tabela
    const columns = [
        {
            key: 'nome',
            header: 'Nome da Conta',
            render: (i: ContaFinanceira) => {
                const Icon = i.tipo_conta === 'caixa_fisico' ? Wallet : i.tipo_conta === 'poupanca_aplicacao' ? PiggyBank : Landmark;
                return (
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                            <Icon size={16} />
                        </div>
                        <div>
                            <span className="font-semibold text-gray-900 block">{i.nome}</span>
                            {i.chave_pix && (
                                <span className="text-xs text-gray-400 block truncate max-w-[200px]">
                                    PIX: {i.chave_pix}
                                </span>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'empresa',
            header: 'Empresa',
            render: (i: ContaFinanceira) => <CompanyBadge company={i.empresa} />
        },
        {
            key: 'tipo_conta',
            header: 'Tipo',
            render: (i: ContaFinanceira) => {
                const mapTipo: Record<TipoContaFinanceira, { label: string; bg: string; text: string }> = {
                    corrente: { label: 'Conta Corrente', bg: 'bg-blue-50', text: 'text-blue-700' },
                    poupanca_aplicacao: { label: 'Aplicação / Poupança', bg: 'bg-purple-50', text: 'text-purple-700' },
                    caixa_fisico: { label: 'Caixa Físico', bg: 'bg-amber-50', text: 'text-amber-800' }
                };
                const config = mapTipo[i.tipo_conta] || mapTipo.corrente;
                return (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                        {config.label}
                    </span>
                );
            }
        },
        {
            key: 'dados_bancarios',
            header: 'Agência / Conta',
            render: (i: ContaFinanceira) => {
                if (i.tipo_conta === 'caixa_fisico') {
                    return <span className="text-sm text-gray-400 italic">Espécie (Caixa)</span>;
                }
                const ag = i.agencia ? `Ag: ${i.agencia}` : '';
                const cc = i.conta ? `Cc: ${i.conta}` : '';
                const text = [ag, cc].filter(Boolean).join(' • ');
                return <span className="text-sm text-gray-700 font-medium">{text || '-'}</span>;
            }
        },
        {
            key: 'limite_cheque_especial',
            header: 'Cheque Especial',
            render: (i: ContaFinanceira) => {
                if (i.tipo_conta !== 'corrente' || !i.limite_cheque_especial) {
                    return <span className="text-gray-400">-</span>;
                }
                return (
                    <span className="font-medium text-gray-800">
                        {formatCurrency(i.limite_cheque_especial)}
                    </span>
                );
            }
        },
        {
            key: 'saldo_atual',
            header: 'Saldo Atual',
            render: (i: ContaFinanceira) => {
                const isNegativo = i.saldo_atual < 0;
                return (
                    <div className="flex flex-col">
                        <span
                            className={`font-bold ${
                                isNegativo ? 'text-red-700' : 'text-green-700'
                            }`}
                        >
                            {formatCurrency(i.saldo_atual)}
                        </span>
                        {isNegativo && (
                            <span className="text-xs text-red-600 font-semibold flex items-center gap-0.5">
                                <ShieldAlert size={12} /> Devedor
                            </span>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'status',
            header: 'Status',
            render: (i: ContaFinanceira) => (
                <StatusBadge
                    active={i.status === 'ativa'}
                    activeLabel="Ativa"
                    inactiveLabel="Inativa"
                />
            )
        }
    ];

    // Se o usuário não tiver permissão
    if (!hasPermission) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl p-8 border border-gray-100 text-center">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
                    <ShieldAlert size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Acesso Restrito</h3>
                <p className="text-gray-500 max-w-md text-sm">
                    Você não possui permissão para visualizar o módulo de Contas Financeiras.
                    Este setor é restrito a administradores e gestores do setor Financeiro.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Contas Financeiras"
                subtitle="Gestão de disponibilidades, contas bancárias e caixas físicos"
                action={
                    <PrimaryButton onClick={handleNovaConta} className="w-full sm:w-auto justify-center">
                        <Plus size={16} className="mr-2" />
                        Nova Conta
                    </PrimaryButton>
                }
            />

            {/* Cards de Resumo (Topo) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="Saldo em Bancos"
                    value={formatCurrency(saldoBancos)}
                    type="info"
                    icon={Landmark}
                />
                <StatCard
                    title="Saldo em Caixa Físico"
                    value={formatCurrency(saldoCaixa)}
                    type="warning"
                    icon={Wallet}
                />
                <StatCard
                    title="Saldo Geral Consolidado"
                    value={formatCurrency(saldoGeral)}
                    type={saldoGeral >= 0 ? 'success' : 'total'}
                    icon={DollarSign}
                />
            </div>

            {/* Barra de Filtros e Busca */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome da conta, banco, agência, conta ou PIX..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <select
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                        value={tipoFilter}
                        onChange={(e) => setTipoFilter(e.target.value as any)}
                    >
                        <option value="TODOS">Todos os Tipos</option>
                        <option value="corrente">Conta Corrente</option>
                        <option value="poupanca_aplicacao">Poupança / Aplicação</option>
                        <option value="caixa_fisico">Caixa Físico</option>
                    </select>

                    <select
                        className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="TODOS">Todos os Status</option>
                        <option value="ativa">Ativas</option>
                        <option value="inativa">Inativas</option>
                    </select>
                </div>
            </div>

            {/* Filtro de Abas de Empresa - Logo após a barra de pesquisa e filtros (mesmo padrão de Faturamentos) */}
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

            {/* Listagem Responsiva */}
            <ResponsiveTable
                data={filteredContas}
                columns={columns}
                keyExtractor={(item) => item.id}
                loading={isLoading}
                getRowBorderColor={(item) =>
                    item.empresa === 'FEMOG' ? 'border-blue-500' : 'border-orange-500'
                }
                onRowClick={handleView}
                renderCard={(item) => {
                    const isNegativo = item.saldo_atual < 0;
                    return (
                        <div
                            className={`flex flex-col gap-2 relative border-l-4 pl-3 ${
                                item.empresa === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-bold text-gray-900 block">{item.nome}</span>
                                    <span className="text-xs text-gray-500">
                                        {item.tipo_conta === 'corrente'
                                            ? 'Conta Corrente'
                                            : item.tipo_conta === 'poupanca_aplicacao'
                                            ? 'Poupança / Aplicação'
                                            : 'Caixa Físico'}
                                    </span>
                                </div>
                                <StatusBadge
                                    active={item.status === 'ativa'}
                                    activeLabel="Ativa"
                                    inactiveLabel="Inativa"
                                />
                            </div>

                            <div className="flex justify-between items-center text-xs text-gray-500">
                                <CompanyBadge company={item.empresa} />
                                {item.tipo_conta !== 'caixa_fisico' && (
                                    <span>
                                        Ag: {item.agencia || '-'} • Cc: {item.conta || '-'}
                                    </span>
                                )}
                            </div>

                            <div className="flex justify-between items-center border-t border-gray-100 pt-2 mt-1">
                                <span className="text-xs text-gray-500">Saldo Atual</span>
                                <span
                                    className={`font-bold ${
                                        isNegativo ? 'text-red-700' : 'text-green-700'
                                    }`}
                                >
                                    {formatCurrency(item.saldo_atual)}
                                </span>
                            </div>
                        </div>
                    );
                }}
            />
        </div>
    );
};

export default ContasFinanceiras;
