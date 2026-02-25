import React, { useState, useMemo, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import { useModal } from '../../context/ModalContext';
import StatCard from '../../components/StatCard';
import { useMovimentacoes } from './hooks/useMovimentacoes';
import MovimentacaoForm from './components/MovimentacaoForm';
import MovimentacaoDetails from './components/MovimentacaoDetails';
import type { Movimentacao } from './types';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Movimentacoes: React.FC = () => {
    const { openViewModal, openConfirmModal, openFormModal, showFeedback } = useModal();

    // Filtros e Paginação Status
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [monthFilter, setMonthFilter] = useState(format(new Date(), "MM/yyyy", { locale: ptBR })); // Default current month
    const [page, setPage] = useState(1);
    const pageSize = 15;

    // Efeito de Debounce para a pesquisa
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1); // Reseta a pagina se mudar a busca
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Reseta página ao mudar o mês
    useEffect(() => {
        setPage(1);
    }, [monthFilter]);

    // Parse do monthFilter (ex: "02/2026")
    const parsedFilters = useMemo(() => {
        if (monthFilter === 'TODOS') return { month: undefined, year: undefined };
        const [m, y] = monthFilter.split('/');
        return { month: m, year: y };
    }, [monthFilter]);

    // Consome os dados do Servidor
    const {
        movimentacoes,
        totalPages,
        kpis,
        isLoading,
        refetch,
        delete: deleteMovimentacao
    } = useMovimentacoes({
        page,
        pageSize,
        searchTerm: debouncedSearch,
        month: parsedFilters.month,
        year: parsedFilters.year
    });

    // Mapeador de meses (Podemos ter uma lista estática ou buscar do servidor no futuro. Por hora, geramos os ultimos 12 meses visualmente)
    const monthOptions = useMemo(() => {
        const options = [];
        const date = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
            options.push({
                value: format(d, "MM/yyyy", { locale: ptBR }),
                label: format(d, "MMMM 'de' yyyy", { locale: ptBR })
            });
        }
        return options;
    }, []);

    // Calcular KPIs Baseados no Filtro Atual
    const { totalRodados, totalKw, totalMovimentacoes } = useMemo(() => {
        return {
            totalRodados: Number(kpis?.total_km_rodados || 0),
            totalKw: Number(kpis?.total_consumo_kw || 0),
            totalMovimentacoes: Number(kpis?.total_movimentacoes || 0)
        }
    }, [kpis]);


    // Handlers CRUD
    const handleCreate = () => {
        openFormModal('Lançar Movimentação', <MovimentacaoForm onSuccess={refetch} />);
    };

    const handleView = (mov: Movimentacao) => {
        openViewModal(
            'Detalhes da Movimentação',
            <MovimentacaoDetails movimentacao={mov} />,
            {
                canEdit: true,
                canDelete: true,
                onEdit: () => openFormModal('Editar Movimentação', <MovimentacaoForm initialData={mov} onSuccess={refetch} />),
                onDelete: () => openConfirmModal(
                    'Excluir Movimentação',
                    `Tem certeza que deseja excluir o trajeto deste veículo?`,
                    async () => {
                        try {
                            await deleteMovimentacao(mov.id);
                            // Sucesso é notificado dentro do hook
                        } catch (error) {
                            showFeedback('error', 'Erro ao excluir movimentação.');
                        }
                    }
                )
            }
        );
    };

    const columns = [
        {
            key: 'data',
            header: 'Data / Hora',
            render: (i: Movimentacao) => {
                const initialDate = new Date(i.data_hora_inicial);
                const finalDate = new Date(i.data_hora_final);
                const minDiff = differenceInMinutes(finalDate, initialDate);
                const hours = Math.floor(minDiff / 60);
                const minutes = minDiff % 60;
                const duracao = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{format(initialDate, "dd/MM/yyyy", { locale: ptBR })}</span>
                        <span className="text-xs text-gray-500">{format(initialDate, "HH:mm")} - {format(finalDate, "HH:mm")} ({duracao})</span>
                    </div>
                )
            }
        },
        {
            key: 'veiculo',
            header: 'Veículo',
            render: (i: Movimentacao) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{i.veiculo?.marca_modelo}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-widest">{i.veiculo?.placa}</span>
                </div>
            )
        },
        {
            key: 'trajeto',
            header: 'Trajeto',
            render: (i: Movimentacao) => (
                <div className="flex items-center gap-2 max-w-[200px] truncate text-gray-700">
                    <MapPin size={14} className="text-orange-500 shrink-0" />
                    <span className="truncate" title={i.trajeto}>{i.trajeto}</span>
                </div>
            )
        },
        {
            key: 'metricas',
            header: 'Rodados / Consumo',
            render: (i: Movimentacao) => (
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-blue-600">+{i.km_rodados} km</span>
                    {i.veiculo?.tipo === 'Elétrico' && i.consumo_kw !== null && i.consumo_kw !== undefined && (
                        <span className="text-xs text-emerald-600">-{i.consumo_kw.toFixed(2)} kWh</span>
                    )}
                </div>
            )
        },
        {
            key: 'responsavel',
            header: 'Responsável',
            render: (i: Movimentacao) => (
                <span className="text-sm text-gray-600">{i.responsavel}</span>
            )
        }
    ];

    const renderCard = (i: Movimentacao) => {
        const isEletrico = i.veiculo?.tipo === 'Elétrico';
        const initialDate = new Date(i.data_hora_inicial);

        return (
            <div className={`flex flex-col gap-3 relative border-l-4 pl-3 ${isEletrico ? 'border-l-emerald-500' : 'border-l-gray-300'}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-gray-900">{i.veiculo?.marca_modelo || 'Veículo'}</h3>
                        <p className="font-mono text-xs text-gray-500 mb-1">{i.veiculo?.placa}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900 text-right">{format(initialDate, "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>

                <div className="text-sm text-gray-700 truncate" title={i.trajeto}>
                    <MapPin size={14} className="inline mr-1 text-orange-400" />
                    {i.trajeto}
                </div>

                <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                    <span className="font-medium text-blue-600">+{i.km_rodados} km</span>
                    {isEletrico && i.consumo_kw !== undefined && i.consumo_kw !== null && (
                        <span className="text-emerald-600 font-medium">-{i.consumo_kw.toFixed(1)} kWh</span>
                    )}
                    {!isEletrico && <span className="text-gray-400 text-xs">Combustão</span>}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Movimentações"
                subtitle="Registre, avalie trajetos e controle os gastos energéticos (kWh) da frota."
                action={
                    <div className="w-full sm:w-auto">
                        <PrimaryButton onClick={handleCreate} className="w-full justify-center bg-indigo-600 hover:bg-indigo-700">
                            <MapPin size={20} className="mr-2" />
                            Lançar Movimentação
                        </PrimaryButton>
                    </div>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard
                    title="Total de Lançamentos"
                    value={String(totalMovimentacoes)}
                    type="total"
                />
                <StatCard
                    title="Quilômetros"
                    value={`${totalRodados.toFixed(1)} km`}
                    type="info"
                />
                <StatCard
                    title="Gasto Energético"
                    value={`${totalKw.toFixed(1)} kWh`}
                    type="success"
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
                            <option key={value} value={value} className="capitalize">{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <ResponsiveTable<Movimentacao>
                data={movimentacoes}
                columns={columns}
                onRowClick={handleView}
                emptyMessage="Nenhuma movimentação registrada neste período."
                renderCard={renderCard}
                keyExtractor={(item) => item.id}
                loading={isLoading}
                getRowBorderColor={(item) => item.veiculo?.tipo === 'Elétrico' ? 'border-emerald-500' : 'border-gray-300'}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    );
};

export default Movimentacoes;
