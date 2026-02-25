import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Droplet, Calendar, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import StatCard from '../../components/StatCard';
import { useModal } from '../../context/ModalContext';
import { useAbastecimentos } from './hooks/useAbastecimentos';
import AbastecimentoForm from './components/AbastecimentoForm';
import AbastecimentoDetails from './components/AbastecimentoDetails';
import type { Abastecimento } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const Abastecimentos: React.FC = () => {
    const { openViewModal, openConfirmModal, openFormModal, closeModal, showFeedback } = useModal();

    // Filters and Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [monthFilter, setMonthFilter] = useState('TODOS');
    const [page, setPage] = useState(1);
    const pageSize = 15;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        setPage(1);
    }, [monthFilter]);

    const {
        abastecimentos,
        totalPages,
        kpis,
        isLoading,
        deleteAbastecimento
    } = useAbastecimentos({
        page,
        pageSize,
        searchTerm: debouncedSearch,
        monthFilter: monthFilter === 'TODOS' ? undefined : monthFilter
    });

    const handleCreate = () => {
        openFormModal('Novo Abastecimento', <AbastecimentoForm onSuccess={closeModal} />);
    };

    const handleEdit = (abastecimento: Abastecimento) => {
        openFormModal('Editar Abastecimento', <AbastecimentoForm initialData={abastecimento} onSuccess={closeModal} />);
    };

    const handleDelete = (abastecimento: Abastecimento) => {
        openConfirmModal(
            'Excluir Abastecimento',
            `Tem certeza que deseja excluir o abastecimento de ${formatCurrency(abastecimento.valor)} do veículo ${abastecimento.frota_veiculos?.placa}?`,
            async () => {
                try {
                    await deleteAbastecimento(abastecimento.id);
                    closeModal();
                } catch (error) {
                    showFeedback('error', 'Erro ao excluir abastecimento.');
                }
            }
        );
    };

    const handleView = (abastecimento: Abastecimento) => {
        openViewModal(
            'Detalhes do Abastecimento',
            <AbastecimentoDetails abastecimento={abastecimento} />,
            {
                canEdit: true,
                canDelete: true,
                onEdit: () => { handleEdit(abastecimento); },
                onDelete: () => { handleDelete(abastecimento); }
            }
        );
    };

    // Calculate KPIs purely from Server Aggregation
    const gastoMesAtual = Number(kpis?.gasto_mes_atual || 0);
    const gastoMesAnterior = Number(kpis?.gasto_mes_anterior || 0);
    const gastoUltimos3Meses = Number(kpis?.gasto_ultimos_3_meses || 0);

    // Static Month Options based on the last 12 months
    const monthOptions = useMemo(() => {
        const options = [];
        const date = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
            options.push({
                value: format(d, "yyyy-MM", { locale: ptBR }),
                label: format(d, "MMM/yyyy", { locale: ptBR }).replace('.', '').toUpperCase()
            });
        }
        return options;
    }, []);

    const renderCard = (i: Abastecimento) => {
        const itemDate = new Date(i.data);
        const correctedDate = new Date(itemDate.getTime() + itemDate.getTimezoneOffset() * 60000);

        return (
            <div className={`flex flex-col gap-2 relative border-l-4 pl-3 border-l-blue-500`}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-gray-900">{i.frota_veiculos?.marca_modelo}</h3>
                        <p className="text-xs text-gray-500 font-mono">{i.frota_veiculos?.placa}</p>
                    </div>
                    <span className="font-bold text-gray-900">{formatCurrency(i.valor)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-1 border-t border-gray-100 mt-1">
                    <span className="text-gray-500 text-xs flex items-center gap-1">
                        <Droplet size={12} className="text-blue-500" />
                        {i.litros}L
                    </span>
                    <span className="text-gray-500 text-xs">{format(correctedDate, 'dd/MM/yyyy')}</span>
                </div>
            </div>
        );
    };

    const columns = [
        {
            key: 'data',
            header: 'Data',
            render: (i: Abastecimento) => {
                const itemDate = new Date(i.data);
                const correctedDate = new Date(itemDate.getTime() + itemDate.getTimezoneOffset() * 60000);
                return <span className="text-gray-900">{format(correctedDate, 'dd/MM/yyyy')}</span>;
            }
        },
        {
            key: 'veiculo',
            header: 'Veículo',
            render: (i: Abastecimento) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{i.frota_veiculos?.marca_modelo || '-'}</span>
                    <span className="text-xs text-gray-500 font-mono">{i.frota_veiculos?.placa || '-'}</span>
                </div>
            )
        },
        {
            key: 'litros',
            header: 'Volume',
            render: (i: Abastecimento) => (
                <span className="text-gray-600 flex items-center gap-1.5">
                    <Droplet size={14} className="text-blue-500" />
                    {i.litros} L
                </span>
            )
        },
        {
            key: 'valor',
            header: 'Valor',
            render: (i: Abastecimento) => (
                <span className="font-medium text-gray-900">{formatCurrency(i.valor)}</span>
            )
        },
        {
            key: 'responsavel',
            header: 'Responsável',
            render: (i: Abastecimento) => (
                <span className="text-sm text-gray-600">{i.responsavel}</span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Abastecimentos"
                subtitle="Acompanhe o consumo e gastos com combustíveis da frota."
                action={
                    <div className="w-full sm:w-auto">
                        <PrimaryButton onClick={handleCreate} className="w-full justify-center">
                            <Plus size={20} className="mr-2" />
                            Lançar Abastecimento
                        </PrimaryButton>
                    </div>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard
                    title="Gasto Mês Atual"
                    value={formatCurrency(gastoMesAtual)}
                    type="total"
                    icon={Calendar}
                />
                <StatCard
                    title="Gasto Mês Anterior"
                    value={formatCurrency(gastoMesAnterior)}
                    type="warning"
                    icon={Calendar}
                />
                <StatCard
                    title="Total Últimos 3 Meses"
                    value={formatCurrency(gastoUltimos3Meses)}
                    type="success"
                    icon={TrendingUp}
                />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Pesquisar veículo, placa ou responsável..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-auto">
                    <select
                        className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm w-full"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                    >
                        <option value="TODOS">Todas as Datas</option>
                        {monthOptions.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <ResponsiveTable<Abastecimento>
                data={abastecimentos}
                columns={columns}
                emptyMessage="Nenhum abastecimento encontrado."
                renderCard={renderCard}
                keyExtractor={(item) => item.id}
                onRowClick={handleView}
                loading={isLoading}
                getRowBorderColor={() => 'border-blue-500'}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />

        </div>
    );
};

export default Abastecimentos;
