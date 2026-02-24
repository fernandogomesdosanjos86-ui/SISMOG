import React, { useState } from 'react';
import { Plus, Search, Droplet, Calendar, TrendingUp } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import { useModal } from '../../context/ModalContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useAbastecimentos } from './hooks/useAbastecimentos';
import AbastecimentoForm from './components/AbastecimentoForm';
import AbastecimentoDetails from './components/AbastecimentoDetails';
import type { Abastecimento } from './types';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const Abastecimentos: React.FC = () => {
    const { abastecimentos, isLoading, deleteAbastecimento } = useAbastecimentos();
    const { openViewModal, openConfirmModal, openFormModal, closeModal, showFeedback } = useModal();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);

    // Month/Year filter (Format: "YYYY-MM")
    const today = new Date();
    const [monthFilter, setMonthFilter] = useState('TODOS');

    // Filter Logic
    const filteredAbastecimentos = abastecimentos.filter(item => {
        // Date match
        let matchesMonth = true;
        if (monthFilter !== 'TODOS') {
            const [year, month] = monthFilter.split('-');
            const itemDate = new Date(item.data);
            matchesMonth = itemDate.getFullYear() === parseInt(year) &&
                (itemDate.getMonth() + 1) === parseInt(month);
        }

        // Search match
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch =
            item.responsavel.toLowerCase().includes(searchLower) ||
            item.frota_veiculos?.marca_modelo.toLowerCase().includes(searchLower) ||
            item.frota_veiculos?.placa.toLowerCase().includes(searchLower);

        return matchesMonth && matchesSearch;
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

    // Calculate KPIs
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    const previousMonthStart = startOfMonth(subMonths(today, 1));
    const previousMonthEnd = endOfMonth(subMonths(today, 1));
    const last3MonthsStart = startOfMonth(subMonths(today, 2));

    let gastoMesAtual = 0;
    let gastoMesAnterior = 0;
    let gastoUltimos3Meses = 0;

    abastecimentos.forEach(item => {
        // use item.data
        const itemDate = new Date(item.data);
        const localDateObj = new Date(itemDate.getTime() + itemDate.getTimezoneOffset() * 60000);

        // Month Current
        if (isWithinInterval(localDateObj, { start: currentMonthStart, end: currentMonthEnd })) {
            gastoMesAtual += Number(item.valor);
        }
        // Month Previous
        if (isWithinInterval(localDateObj, { start: previousMonthStart, end: previousMonthEnd })) {
            gastoMesAnterior += Number(item.valor);
        }
        // Last 3 Months
        if (localDateObj >= last3MonthsStart) {
            gastoUltimos3Meses += Number(item.valor);
        }
    });

    // Extract unique months from existing abastecimentos
    const monthOptions = React.useMemo(() => {
        if (!abastecimentos || abastecimentos.length === 0) return [];

        const uniqueMonths = new Set<string>();
        abastecimentos.forEach(item => {
            if (!item.data) return;
            const itemDate = new Date(item.data);
            const localDateObj = new Date(itemDate.getTime() + itemDate.getTimezoneOffset() * 60000);
            uniqueMonths.add(format(localDateObj, 'yyyy-MM'));
        });

        return Array.from(uniqueMonths)
            .sort((a, b) => b.localeCompare(a)) // sort descending
            .map(value => {
                const [year, month] = value.split('-');
                const d = new Date(parseInt(year), parseInt(month) - 1, 1);
                const label = format(d, 'MMM/yyyy', { locale: ptBR }).replace('.', '').toUpperCase();
                return { value, label };
            });
    }, [abastecimentos]);

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-blue-600 font-medium">Gasto Mês Atual</p>
                        <p className="text-2xl font-bold text-gray-800">{formatCurrency(gastoMesAtual)}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <Calendar size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-orange-600 font-medium">Gasto Mês Anterior</p>
                        <p className="text-2xl font-bold text-gray-800">{formatCurrency(gastoMesAnterior)}</p>
                    </div>
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                        <Calendar size={24} />
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-green-600 font-medium">Total Últimos 3 Meses</p>
                        <p className="text-2xl font-bold text-gray-800">{formatCurrency(gastoUltimos3Meses)}</p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                        <TrendingUp size={24} />
                    </div>
                </div>
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
                data={filteredAbastecimentos}
                columns={columns}
                emptyMessage="Nenhum abastecimento encontrado."
                renderCard={renderCard}
                keyExtractor={(item) => item.id}
                onRowClick={handleView}
                loading={isLoading}
                getRowBorderColor={() => 'border-blue-500'}
            />

        </div>
    );
};

export default Abastecimentos;
