import React, { useState, useMemo } from 'react';
import { Plus, Search, Clock, Building2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ResponsiveTable from '../../components/ResponsiveTable';
import StatCard from '../../components/StatCard';
import PrimaryButton from '../../components/PrimaryButton';
import { useModal } from '../../context/ModalContext';
import { useBancoHoras } from './hooks/useBancoHoras';
import BancoHorasForm from './pages/BancoHorasForm';
import BancoHorasDetails from './pages/BancoHorasDetails';
import type { BancoHoras as BancoHorasType } from './types';
import { useDebounce } from '../../hooks/useDebounce';
import CompanyBadge from '../../components/CompanyBadge';
import { normalizeSearchString } from '../../utils/normalization';

export const formatMinutesToHHmm = (minutes: number) => {
    const isNegative = minutes < 0;
    const absMinutes = Math.abs(minutes);
    const h = Math.floor(absMinutes / 60);
    const m = absMinutes % 60;
    const sign = isNegative ? '-' : '';
    return `${sign}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const formatSaldo = (minutes: number) => {
    if (minutes > 0) return <span className="text-green-600 font-bold">+{formatMinutesToHHmm(minutes)}</span>;
    if (minutes < 0) return <span className="text-red-600 font-bold">{formatMinutesToHHmm(minutes)}</span>;
    return <span className="text-gray-500 font-medium">00:00</span>;
};

const BancoHoras: React.FC = () => {
    const { openFormModal, openViewModal, closeModal } = useModal();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [companyFilter, setCompanyFilter] = useState<'TODOS' | 'FEMOG' | 'SEMOG'>('TODOS');

    // Fetch Data
    const { bancoHoras, isLoading, refetch, create, update, delete: deleteService } = useBancoHoras();

    // Grouping logic by employee
    const groupedData = useMemo(() => {
        const groups: Record<string, {
            funcionario_id: string;
            funcionario_nome: string;
            empresa: 'FEMOG' | 'SEMOG';
            saldo_minutos: number;
            items: BancoHorasType[];
        }> = {};

        // 1. First filter
        const searchNormalized = normalizeSearchString(debouncedSearchTerm);
        const filtered = bancoHoras.filter(a => {
            const matchesCompany = companyFilter === 'TODOS' || a.empresa === companyFilter;
            const matchesSearch = normalizeSearchString(a.funcionario?.nome || '').includes(searchNormalized);
            return matchesCompany && matchesSearch;
        });

        // 2. Then group
        filtered.forEach(item => {
            if (!groups[item.funcionario_id]) {
                groups[item.funcionario_id] = {
                    funcionario_id: item.funcionario_id,
                    funcionario_nome: item.funcionario?.nome || 'Desconhecido',
                    empresa: item.empresa,
                    saldo_minutos: 0,
                    items: []
                };
            }
            
            // Calculate sum: Positiva adds, Negativa subtracts, Compensação adds
            let mins = item.duracao_minutos;
            if (item.tipo === 'Positiva' || item.tipo === 'Compensação') {
                groups[item.funcionario_id].saldo_minutos += mins;
            } else if (item.tipo === 'Negativa') {
                groups[item.funcionario_id].saldo_minutos -= mins;
            }
            
            groups[item.funcionario_id].items.push(item);
        });

        // Convert to array and sort alphabetically by name
        return Object.values(groups).sort((a, b) => a.funcionario_nome.localeCompare(b.funcionario_nome));
    }, [bancoHoras, debouncedSearchTerm, companyFilter]);

    // KPIs
    const totalMinutos = bancoHoras.reduce((acc, item) => {
        if (item.tipo === 'Positiva' || item.tipo === 'Compensação') return acc + item.duracao_minutos;
        return acc - item.duracao_minutos;
    }, 0);
    
    const femogMinutos = bancoHoras.filter(a => a.empresa === 'FEMOG').reduce((acc, item) => {
        if (item.tipo === 'Positiva' || item.tipo === 'Compensação') return acc + item.duracao_minutos;
        return acc - item.duracao_minutos;
    }, 0);
    
    const semogMinutos = bancoHoras.filter(a => a.empresa === 'SEMOG').reduce((acc, item) => {
        if (item.tipo === 'Positiva' || item.tipo === 'Compensação') return acc + item.duracao_minutos;
        return acc - item.duracao_minutos;
    }, 0);

    // Actions
    const handleNew = () => {
        openFormModal(
            'Novo Registro de Banco de Horas',
            <BancoHorasForm onSuccess={() => { refetch(); closeModal(); }} create={create} update={(id, data) => update({ id, data })} />
        );
    };

    const handleEdit = (item: BancoHorasType) => {
        openFormModal(
            'Editar Registro de Banco de Horas',
            <BancoHorasForm
                initialData={item}
                onSuccess={() => { refetch(); closeModal(); }}
                create={create}
                update={(id, data) => update({ id, data })}
            />
        );
    };

    const handleViewDetails = (group: typeof groupedData[0]) => {
        openViewModal(
            'Detalhes do Banco de Horas',
            <BancoHorasDetails
                employeeName={group.funcionario_nome}
                saldoMinutos={group.saldo_minutos}
                bancoHoras={group.items}
                onEdit={handleEdit}
                onDelete={async (id) => await deleteService(id)}
            />
        );
    };

    const columns = [
        {
            header: 'Funcionário',
            key: 'funcionario_nome',
            render: (item: typeof groupedData[0]) => (
                <div className="font-medium text-gray-900">{item.funcionario_nome}</div>
            )
        },
        {
            header: 'Empresa',
            key: 'empresa',
            render: (item: typeof groupedData[0]) => <CompanyBadge company={item.empresa as any} />
        },
        {
            header: 'Saldo',
            key: 'saldo',
            render: (item: typeof groupedData[0]) => (
                <div className="text-gray-700">{formatSaldo(item.saldo_minutos)}</div>
            )
        },
        {
            header: 'Registros',
            key: 'registros',
            render: (item: typeof groupedData[0]) => (
                <div className="text-gray-500 text-sm">{item.items.length} registro(s)</div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Banco de Horas"
                subtitle="Gestão de horas extras, faltas e compensações"
                action={
                    <PrimaryButton
                        onClick={handleNew}
                        className="w-full sm:w-auto"
                        icon={<Plus size={20} />}
                    >
                        Novo Registro
                    </PrimaryButton>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Banco de Horas Total"
                    value={formatMinutesToHHmm(totalMinutos)}
                    icon={Clock}
                    type="total"
                    className={totalMinutos < 0 ? "border-red-500" : "border-green-500"}
                />
                <StatCard
                    title="Banco de Horas FEMOG"
                    value={formatMinutesToHHmm(femogMinutos)}
                    icon={Building2}
                    type="info"
                />
                <StatCard
                    title="Banco de Horas SEMOG"
                    value={formatMinutesToHHmm(semogMinutos)}
                    icon={Building2}
                    type="warning"
                />
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar funcionário..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Company Tabs */}
            <div className="flex bg-white p-1 rounded-lg w-fit shadow-sm">
                {['TODOS', 'FEMOG', 'SEMOG'].map((tab) => (
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

            {/* Data Table */}
            <ResponsiveTable
                data={groupedData}
                columns={columns}
                keyExtractor={(item) => item.funcionario_id}
                onRowClick={handleViewDetails}
                loading={isLoading}
                skeletonRows={3}
                getRowBorderColor={(item) => item.empresa === 'FEMOG' ? 'border-blue-500' : 'border-orange-500'}
                renderCard={(item) => (
                    <div className={`border-l-4 pl-3 py-1 ${item.empresa === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h4 className="font-bold text-gray-900">{item.funcionario_nome}</h4>
                                <div className="mt-1">
                                    <CompanyBadge company={item.empresa as any} />
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {item.items.length} reg.
                            </span>
                        </div>
                        <div className="mt-3 p-2 bg-gray-50 rounded-lg text-center">
                            <p className="text-[10px] text-gray-500 uppercase">Saldo</p>
                            <p className="font-semibold text-lg">{formatSaldo(item.saldo_minutos)}</p>
                        </div>
                    </div>
                )}
            />

            {isLoading && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}
        </div>
    );
};

export default BancoHoras;
