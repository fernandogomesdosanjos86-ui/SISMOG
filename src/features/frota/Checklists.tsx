import React, { useState, useMemo, useEffect } from 'react';
import { Search, ClipboardCheck, AlertTriangle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import { useModal } from '../../context/ModalContext';
import { useChecklists } from './hooks/useChecklists';
import ChecklistForm from './components/ChecklistForm';
import ChecklistDetails from './components/ChecklistDetails';
import type { Checklist } from './types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TabType = 'TODAS' | 'AVARIAS';

const Checklists: React.FC = () => {
    const { openViewModal, openConfirmModal, openFormModal, closeModal, showFeedback } = useModal();

    const [activeTab, setActiveTab] = useState<TabType>('TODAS');
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
    }, [monthFilter, activeTab]);

    const {
        checklists,
        totalPages,
        isLoading,
        deleteChecklist
    } = useChecklists({
        page,
        pageSize,
        searchTerm: debouncedSearch,
        monthFilter: monthFilter === 'TODOS' ? undefined : monthFilter,
        avariasOnly: activeTab === 'AVARIAS'
    });

    // Static months for the last 12 months
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

    const handleCreate = () => {
        openFormModal('Novo Checklist Diário', <ChecklistForm onSuccess={closeModal} />);
    };

    const handleEdit = (checklist: Checklist) => {
        openFormModal('Editar Checklist', <ChecklistForm initialData={checklist} onSuccess={closeModal} />);
    };

    const handleDelete = (checklist: Checklist) => {
        openConfirmModal(
            'Excluir Checklist',
            `Tem certeza que deseja excluir o checklist do veículo ${checklist.frota_veiculos?.placa} (${format(new Date(checklist.data), 'dd/MM/yyyy')})?`,
            async () => {
                try {
                    await deleteChecklist(checklist.id);
                    closeModal();
                } catch (error) {
                    showFeedback('error', 'Erro ao excluir checklist.');
                }
            }
        );
    };

    const handleView = (checklist: Checklist) => {
        openViewModal(
            'Detalhes do Checklist',
            <ChecklistDetails checklist={checklist} />,
            {
                canEdit: true,
                canDelete: true,
                onEdit: () => { handleEdit(checklist); },
                onDelete: () => { handleDelete(checklist); }
            }
        );
    };

    const renderTabs = () => (
        <div className="flex bg-white p-1 rounded-lg w-fit shadow-sm">
            {(['TODAS', 'AVARIAS'] as const).map((tab) => {
                const isActive = activeTab === tab;
                const activeClasses = tab === 'AVARIAS'
                    ? 'bg-orange-50 text-orange-700 shadow-sm ring-1 ring-orange-200'
                    : 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200';

                return (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${isActive
                            ? activeClasses
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {tab === 'TODAS' ? 'Todas' : 'Avarias e Manutenções'}
                    </button>
                );
            })}
        </div>
    );

    const renderCard = (i: Checklist) => {
        const itemDate = new Date(i.data);
        const correctedDate = new Date(itemDate.getTime() + itemDate.getTimezoneOffset() * 60000);

        return (
            <div className={`flex flex-col gap-2 relative border-l-4 pl-3 ${i.avaria_manutencao ? 'border-l-orange-500' : 'border-l-blue-500'}`}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            {i.frota_veiculos?.marca_modelo}
                            {i.avaria_manutencao && <AlertTriangle size={14} className="text-orange-500" />}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono mt-0.5">{i.frota_veiculos?.placa}</p>
                    </div>
                </div>
                <div className="flex justify-between items-center text-sm pt-1 border-t border-gray-100 mt-1">
                    <span className="text-gray-500 text-xs">
                        KM: {i.km_atual.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-gray-500 text-xs font-medium">{format(correctedDate, 'dd/MM/yyyy')}</span>
                </div>
            </div>
        );
    };

    const columns = [
        {
            key: 'data',
            header: 'Data',
            render: (i: Checklist) => {
                const itemDate = new Date(i.data);
                const correctedDate = new Date(itemDate.getTime() + itemDate.getTimezoneOffset() * 60000);
                return <span className="text-gray-900 font-medium">{format(correctedDate, 'dd/MM/yyyy')}</span>;
            }
        },
        {
            key: 'veiculo',
            header: 'Veículo',
            render: (i: Checklist) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900 flex items-center gap-2">
                        {i.frota_veiculos?.marca_modelo || '-'}
                        {i.avaria_manutencao && <span title="Avaria Identificada" className="w-2 h-2 rounded-full bg-orange-500"></span>}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">{i.frota_veiculos?.placa || '-'}</span>
                </div>
            )
        },
        {
            key: 'km',
            header: 'Odômetro',
            render: (i: Checklist) => (
                <span className="text-gray-600 font-mono">
                    {i.km_atual.toLocaleString('pt-BR')} km
                </span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (i: Checklist) => {
                if (i.avaria_manutencao) {
                    return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">Avaria Reportada</span>
                }
                return <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">OK</span>
            }
        },
        {
            key: 'responsavel',
            header: 'Enviado por',
            render: (i: Checklist) => (
                <span className="text-sm text-gray-600 truncate max-w-[120px] block">{i.responsavel}</span>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Checklists"
                subtitle="Registre inspeções periódicas, controle avarias e a constância da frota."
                action={
                    <div className="w-full sm:w-auto">
                        <PrimaryButton onClick={handleCreate} className="w-full justify-center bg-indigo-600 hover:bg-indigo-700">
                            <ClipboardCheck size={20} className="mr-2" />
                            Lançar Checklist
                        </PrimaryButton>
                    </div>
                }
            />

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

            {/* Tabs */}
            {renderTabs()}

            <ResponsiveTable<Checklist>
                data={checklists}
                columns={columns}
                emptyMessage="Nenhum checklist registrado para essa combinação de filtros."
                renderCard={renderCard}
                keyExtractor={(item) => item.id}
                onRowClick={handleView}
                loading={isLoading}
                getRowBorderColor={(item) => item.avaria_manutencao ? 'border-orange-500' : 'border-blue-500'}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />

        </div>
    );
};

export default Checklists;
