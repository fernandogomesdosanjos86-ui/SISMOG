import React, { useState, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
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
        create: createProduto, update: updateProduto,
    } = useProdutos();
    const {
        movimentacoes, isLoading: loadingMov, refetch: refetchMov,
        create: createMov, delete: deleteMov,
    } = useMovimentacoes();

    const [activeTab, setActiveTab] = useState<Tab>('estoque');


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
    const totalProdutos = produtos.length;
    const totalEstoque = produtos.reduce((acc, p) => acc + p.em_estoque, 0);
    const produtosZerados = produtos.filter(p => p.em_estoque <= 0).length;

    const tabs: { key: Tab; label: string }[] = [
        { key: 'estoque', label: 'Estoque' },
        { key: 'individual', label: 'Individual' },
        { key: 'coletivo', label: 'Coletivo' },
        { key: 'compra_descarte', label: 'Compra/Descarte' },
    ];

    return (
        <div className="p-4 max-w-7xl mx-auto space-y-4">
            {/* Header */}
            <PageHeader
                title="Gestão de Estoque"
                subtitle="Produtos e Movimentações"
                action={
                    <div className="flex gap-2 w-full sm:w-auto">
                        <PrimaryButton onClick={handleNovoProduto} className="flex-1 sm:flex-initial justify-center">
                            <Plus size={18} className="mr-2" />Novo Produto
                        </PrimaryButton>
                        <PrimaryButton onClick={handleNovaMovimentacao} className="flex-1 sm:flex-initial justify-center bg-green-600 hover:bg-green-700">
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

            <div className="bg-white rounded-xl shadow-sm">
                <div className="border-b flex overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === tab.key
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-4">
                    {activeTab === 'estoque' && (
                        <TabEstoque produtos={produtos} isLoading={loadingProdutos} />
                    )}
                    {activeTab === 'individual' && (
                        <TabIndividual
                            onRefresh={handleRefresh}
                            deleteMov={deleteMov}
                        />
                    )}
                    {activeTab === 'coletivo' && (
                        <TabColetivo
                            onRefresh={handleRefresh}
                            deleteMov={deleteMov}
                        />
                    )}
                    {activeTab === 'compra_descarte' && (
                        <TabCompraDescarte
                            movimentacoes={movimentacoes}
                            isLoading={loadingMov}
                            deleteMov={deleteMov}
                            onRefresh={handleRefresh}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default GestaoEstoque;
