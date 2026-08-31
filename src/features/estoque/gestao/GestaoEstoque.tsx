import React, { useState, useCallback, useMemo } from 'react';
import FilterTabs from '../../../components/ui/FilterTabs';
import { Plus, RefreshCw, Search } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import PrimaryButton from '../../../components/PrimaryButton';
import StatCard from '../../../components/StatCard';
import { useModal } from '../../../context/ModalContext';
import { useProdutos } from './hooks/useProdutos';
import { useMovimentacoes } from './hooks/useMovimentacoes';
import ProdutoForm from './components/ProdutoForm';
import MovimentacaoForm from './components/MovimentacaoForm';
import TabEstoque from './components/TabEstoque';
import TabIndividual from './components/TabIndividual';
import TabColetivo from './components/TabColetivo';
import TabCompraDescarte from './components/TabCompraDescarte';

type Tab = 'estoque' | 'individual' | 'coletivo' | 'compra_descarte';

const GestaoEstoque: React.FC = () => {
    const { openFormModal } = useModal();
    const {
        produtos, isLoading: loadingProdutos, refetch: refetchProdutos,
        create: createProduto, update: updateProduto, delete: deleteProduto,
    } = useProdutos();
    const {
        movimentacoes, isLoading: loadingMov, refetch: refetchMov,
        create: createMov, update: updateMov, delete: deleteMov,
    } = useMovimentacoes();

    const [activeTab, setActiveTab] = useState<Tab>('estoque');
    const [searchTerm, setSearchTerm] = useState('');
    const [tipoProdutoFilter, setTipoProdutoFilter] = useState<'TODOS' | 'Individual' | 'Coletivo'>('TODOS');
    const [tipoMovFilter, setTipoMovFilter] = useState<'TODOS' | 'Compra' | 'Descarte'>('TODOS');


    const handleRefresh = useCallback(() => {
        refetchProdutos();
        refetchMov();
    }, [refetchProdutos, refetchMov]);

    const handleNovoProduto = () => {
        openFormModal(
            'Novo Produto',
            <ProdutoForm
                create={createProduto}
                update={updateProduto}
                onSuccess={handleRefresh}
            />
        );
    };

    const handleNovaMovimentacao = () => {
        openFormModal(
            'Nova Movimentação',
            <MovimentacaoForm
                create={createMov}
                onSuccess={handleRefresh}
            />
        );
    };

    // KPI calculations
    const { totalProdutos, totalEstoque, produtosZerados } = useMemo(() => {
        return {
            totalProdutos: produtos.length,
            totalEstoque: produtos.reduce((acc, p) => acc + p.em_estoque, 0),
            produtosZerados: produtos.filter(p => p.em_estoque <= 0).length,
        };
    }, [produtos]);

    const tabs: { key: Tab; label: string }[] = [
        { key: 'estoque', label: 'Estoque' },
        { key: 'individual', label: 'Individual' },
        { key: 'coletivo', label: 'Coletivo' },
        { key: 'compra_descarte', label: 'Compra/Descarte' },
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <PageHeader
                title="Gestão de Estoque"
                subtitle="Produtos e Movimentações"
                action={
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <PrimaryButton onClick={handleNovoProduto} className="w-full sm:w-auto justify-center">
                            <Plus size={18} className="mr-2" />Novo Produto
                        </PrimaryButton>
                        <PrimaryButton onClick={handleNovaMovimentacao} className="w-full sm:w-auto justify-center bg-green-600 hover:bg-green-700">
                            <RefreshCw size={18} className="mr-2" />Nova Movimentação
                        </PrimaryButton>
                    </div>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Produtos Cadastrados" value={String(totalProdutos)} type="total" />
                <StatCard title="Total em Estoque" value={String(totalEstoque)} type="success" />
                <StatCard title="Produtos Zerados" value={String(produtosZerados)} type="warning" />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={
                            activeTab === 'estoque' ? "Buscar por código..." :
                                activeTab === 'compra_descarte' ? "Buscar por código..." :
                                    activeTab === 'coletivo' ? "Buscar por nome do posto..." :
                                        "Buscar por nome..."
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {activeTab === 'estoque' && (
                    <div className="w-full md:w-auto">
                        <select
                            value={tipoProdutoFilter}
                            onChange={e => setTipoProdutoFilter(e.target.value as any)}
                            className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm w-full"
                        >
                            <option value="TODOS">Todos os Tipos</option>
                            <option value="Individual">Individual</option>
                            <option value="Coletivo">Coletivo</option>
                        </select>
                    </div>
                )}

                {activeTab === 'compra_descarte' && (
                    <div className="w-full md:w-auto">
                        <select
                            value={tipoMovFilter}
                            onChange={e => setTipoMovFilter(e.target.value as any)}
                            className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm w-full"
                        >
                            <option value="TODOS">Todas Mov.</option>
                            <option value="Compra">Compra</option>
                            <option value="Descarte">Descarte</option>
                        </select>
                    </div>
                )}
            </div>

            <FilterTabs
                tabs={tabs.map(t => ({ id: t.key, label: t.label }))}
                activeTab={activeTab}
                onChange={(tabId) => {
                    setActiveTab(tabId as Tab);
                    setSearchTerm('');
                }}
                className="w-fit mb-4"
            />

            <div className="bg-white rounded-xl shadow-sm">

                <div className="p-4">
                    {activeTab === 'estoque' && (
                        <TabEstoque
                            produtos={produtos}
                            isLoading={loadingProdutos}
                            searchTerm={searchTerm}
                            tipoFilter={tipoProdutoFilter}
                            onRefresh={handleRefresh}
                            create={createProduto}
                            update={updateProduto}
                            deleteProduto={deleteProduto}
                        />
                    )}
                    {activeTab === 'individual' && (
                        <TabIndividual
                            onRefresh={handleRefresh}
                            deleteMov={deleteMov}
                            updateMov={updateMov}
                            searchTerm={searchTerm}
                        />
                    )}
                    {activeTab === 'coletivo' && (
                        <TabColetivo
                            onRefresh={handleRefresh}
                            deleteMov={deleteMov}
                            updateMov={updateMov}
                            searchTerm={searchTerm}
                        />
                    )}
                    {activeTab === 'compra_descarte' && (
                        <TabCompraDescarte
                            movimentacoes={movimentacoes}
                            isLoading={loadingMov}
                            deleteMov={deleteMov}
                            updateMov={updateMov}
                            onRefresh={handleRefresh}
                            searchTerm={searchTerm}
                            tipoFilter={tipoMovFilter}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default GestaoEstoque;
