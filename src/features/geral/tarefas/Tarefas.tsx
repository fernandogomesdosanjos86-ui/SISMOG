import { useState, useMemo, useEffect } from 'react';
import PageHeader from '../../../components/PageHeader';
import PrimaryButton from '../../../components/PrimaryButton';
import ResponsiveTable from '../../../components/ResponsiveTable';
import { useModal } from '../../../context/ModalContext';
import { useAuth } from '../../../context/AuthContext';
import { Plus, Search, CheckCircle, Clock, AlertCircle, CircleDashed, MessageSquare, ClipboardList, RefreshCw } from 'lucide-react';
import { useTarefas } from './hooks/useTarefas';
import TarefaForm from './components/TarefaForm';
import TarefaDetails from './components/TarefaDetails';
import TarefaStatusBadge from './components/TarefaStatusBadge';
import { format, parseISO } from 'date-fns';
import type { Tarefa } from './types';
import { useTarefasNotification } from './context/TarefasNotificationContext';
import FilterTabs from '../../../components/ui/FilterTabs';

const prioridadeColors: Record<string, string> = {
    'Normal': 'bg-gray-100 text-gray-800',
    'Urgente': 'bg-red-100 text-red-800',
};

const getShortName = (fullName?: string): string => {
    if (!fullName) return 'Desconhecido';
    return fullName.trim().split(' ').slice(0, 2).join(' ');
};



const Tarefas = () => {
    const { user } = useAuth();
    const { tarefas, isLoading, refetch, delete: del } = useTarefas();
    const { openViewModal, openFormModal, openConfirmModal, showFeedback } = useModal();
    const { unreadTaskIds, unreadEvents } = useTarefasNotification();

    // Helper to render notification icons for a given task ID
    const renderNotifIcons = (id: string) => {
        const eventType = unreadEvents.get(id);
        if (!eventType) return null;
        return (
            <span className="flex items-center gap-0.5 ml-1" title={`Nova ${eventType === 'chat' ? 'mensagem' : eventType === 'nova' ? 'tarefa' : 'mudança de status'}`}>
                {eventType === 'chat' && <MessageSquare size={13} className="text-blue-500 fill-blue-100" />}
                {eventType === 'nova' && <ClipboardList size={13} className="text-green-500" />}
                {eventType === 'status' && <RefreshCw size={13} className="text-orange-500" />}
            </span>
        );
    };

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [prioridadeFilter, setPrioridadeFilter] = useState('TODOS');
    const [statusTab, setStatusTab] = useState('Pendente');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const filteredData = useMemo(() => {
        let result = tarefas.filter(i => {
            const matchStatus = statusTab === 'TODOS' || i.status_tarefa === statusTab;
            const matchPrioridade = prioridadeFilter === 'TODOS' || i.prioridade === prioridadeFilter;

            const term = searchTerm.toLowerCase();
            const destinatariosString = i.destinatarios?.map(d => d.usuario?.nome).join(' ') || '';
            const matchSearch =
                (i.titulo && i.titulo.toLowerCase().includes(term)) ||
                (i.remetente?.nome && i.remetente.nome.toLowerCase().includes(term)) ||
                (destinatariosString.toLowerCase().includes(term));

            return matchStatus && matchPrioridade && matchSearch;
        });

        // Sorting: Urgente primeiro -> Data limite crescente
        result = result.sort((a, b) => {
            if (a.prioridade === 'Urgente' && b.prioridade === 'Normal') return -1;
            if (a.prioridade === 'Normal' && b.prioridade === 'Urgente') return 1;

            const dateA = new Date(a.data_limite).getTime();
            const dateB = new Date(b.data_limite).getTime();
            return dateA - dateB;
        });

        return result;
    }, [tarefas, searchTerm, prioridadeFilter, statusTab]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, prioridadeFilter, statusTab]);

    // Derived KPIs
    const kpis = useMemo(() => {
        const total = tarefas.length;
        const pendentes = tarefas.filter(i => i.status_tarefa === 'Pendente').length;
        const emAndamento = tarefas.filter(i => i.status_tarefa === 'Em Andamento').length;
        const concluidas = tarefas.filter(i => i.status_tarefa === 'Concluído').length;
        return { total, pendentes, emAndamento, concluidas };
    }, [tarefas]);

    const handleView = (item: Tarefa) => {
        const isSender = user?.id === item.remetente_id;

        openViewModal(
            'Detalhes da Tarefa',
            <TarefaDetails tarefa={item} />,
            {
                canEdit: isSender,
                onEdit: () => openFormModal('Editar Tarefa', <TarefaForm initialData={item} onSuccess={refetch} />),
                canDelete: isSender,
                onDelete: () => openConfirmModal('Excluir Tarefa', 'Tem certeza que deseja apagar essa tarefa inteira, suas missões e chat?', async () => {
                    await del(item.id);
                    showFeedback('success', 'Tarefa excluída com sucesso!');
                })
            }
        );
    };

    const columns = [
        {
            key: 'data_limite',
            header: 'Data Limite',
            render: (i: Tarefa) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{format(parseISO(i.data_limite), "dd/MM/yyyy")}</span>
                    <span className="text-xs text-gray-500">Solicitado: {format(parseISO(i.data_solicitacao), "dd/MM")}</span>
                </div>
            )
        },
        {
            key: 'titulo',
            header: 'Título',
            render: (i: Tarefa) => {
                const isUnread = unreadTaskIds.includes(i.id);
                return (
                    <div className="flex items-center">
                        <span className="font-semibold text-gray-900">{i.titulo}</span>
                        {isUnread && renderNotifIcons(i.id)}
                    </div>
                );
            }
        },
        {
            key: 'prioridade',
            header: 'Prioridade',
            render: (i: Tarefa) => (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${prioridadeColors[i.prioridade]}`}>
                    {i.prioridade}
                </span>
            )
        },
        {
            key: 'destinatarios',
            header: 'Responsáveis',
            render: (i: Tarefa) => {
                if (!i.destinatarios || i.destinatarios.length === 0) return <span className="text-gray-400 text-sm">Nenhum</span>;
                return (
                    <div className="flex flex-wrap gap-1">
                        {i.destinatarios.map(d => (
                            <span key={d.usuario_id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                {getShortName(d.usuario?.nome)}
                            </span>
                        ))}
                    </div>
                );
            }
        },
        {
            key: 'remetente',
            header: 'Criador',
            render: (i: Tarefa) => <span className="text-sm text-gray-600">{getShortName(i.remetente?.nome)}</span>
        },
        {
            key: 'status',
            header: 'Status',
            render: (i: Tarefa) => <TarefaStatusBadge status={i.status_tarefa} />
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Quadro de Tarefas"
                subtitle="Gestão de tarefas e missões"
                action={
                    <div className="w-full sm:w-auto">
                        <PrimaryButton onClick={() => openFormModal('Nova Tarefa', <TarefaForm onSuccess={refetch} />)} className="w-full justify-center">
                            <Plus size={20} className="mr-2" /> Nova Tarefa
                        </PrimaryButton>
                    </div>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total de Tarefas</p>
                        <p className="text-2xl font-bold text-gray-800">{kpis.total}</p>
                    </div>
                    <div className="p-3 bg-gray-50 text-gray-600 rounded-lg"><CircleDashed size={24} /></div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-yellow-600 font-medium">Pendentes</p>
                        <p className="text-2xl font-bold text-yellow-800">{kpis.pendentes}</p>
                    </div>
                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><Clock size={24} /></div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-blue-600 font-medium">Em Andamento</p>
                        <p className="text-2xl font-bold text-blue-800">{kpis.emAndamento}</p>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><AlertCircle size={24} /></div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-green-600 font-medium">Concluídas</p>
                        <p className="text-2xl font-bold text-green-800">{kpis.concluidas}</p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={24} /></div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar tarefa, destinatários ou solicitante..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="w-full md:w-auto">
                    <select
                        value={prioridadeFilter}
                        onChange={e => setPrioridadeFilter(e.target.value)}
                        className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full"
                    >
                        <option value="TODOS">Todas as Prioridades</option>
                        <option value="Normal">Normal</option>
                        <option value="Urgente">Urgente</option>
                    </select>
                </div>
            </div>

            {/* View Tabs */}
            <div className="mb-4">
                <FilterTabs
                    tabs={[
                        { id: 'TODOS', label: 'Todos os Status' },
                        { id: 'Pendente', label: 'Pendente' },
                        { id: 'Em Andamento', label: 'Em Andamento' },
                        { id: 'Concluído', label: 'Concluído' }
                    ]}
                    activeTab={statusTab}
                    onChange={setStatusTab}
                />
            </div>

            <ResponsiveTable
                data={paginatedData}
                columns={columns}
                keyExtractor={i => i.id}
                onRowClick={handleView}
                loading={isLoading}
                skeletonRows={5}
                emptyMessage="Nenhuma tarefa encontrada."
                getRowBorderColor={i => i.prioridade === 'Urgente' ? 'border-red-500' : 'border-gray-200'}
                renderCard={i => {
                    const isUnread = unreadTaskIds.includes(i.id);
                    return (
                        <div className={`border-l-4 pl-3 ${i.prioridade === 'Urgente' ? 'border-l-red-500' : 'border-l-gray-300'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex flex-1 items-center gap-1 pr-2">
                                    <div className="font-bold text-gray-900 leading-tight">{i.titulo}</div>
                                    {isUnread && renderNotifIcons(i.id)}
                                </div>
                                <TarefaStatusBadge status={i.status_tarefa} />
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {i.destinatarios?.map(d => (
                                    <span key={d.usuario_id} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                        {getShortName(d.usuario?.nome)}
                                    </span>
                                ))}
                            </div>
                            <div className="text-xs text-gray-400 mt-2 flex justify-between items-center bg-gray-50 p-1.5 rounded">
                                <span>Limite: <strong className="text-gray-600">{format(parseISO(i.data_limite), "dd/MM")}</strong></span>
                                {i.prioridade === 'Urgente' && <span className="text-red-600 font-bold uppercase track">Urgente</span>}
                            </div>
                        </div>
                    );
                }}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 py-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Próxima
                    </button>
                </div>
            )}
        </div>
    );
};

export default Tarefas;
