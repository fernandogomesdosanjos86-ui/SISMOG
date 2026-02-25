import React, { useState, useMemo } from 'react';
import PageHeader from '../../../components/PageHeader';
import PrimaryButton from '../../../components/PrimaryButton';
import ResponsiveTable from '../../../components/ResponsiveTable';
import CompanyBadge from '../../../components/CompanyBadge';
import StatCard from '../../../components/StatCard';
import { useModal } from '../../../context/ModalContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { Plus, Search, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useCurriculos } from './hooks/useCurriculos';
import CurriculoForm from './components/CurriculoForm';
import CurriculoDetails from './components/CurriculoDetails';
import CurriculoStatusBadge from './components/CurriculoStatusBadge';
import type { Curriculo } from './types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Curriculos = () => {
    const { curriculos, isLoading, refetch, delete: del } = useCurriculos();
    const { openViewModal, openFormModal, openConfirmModal, showFeedback } = useModal();

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [cargoFilter, setCargoFilter] = useState('TODOS');
    const [statusTab, setStatusTab] = useState('TODOS');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const cargosDisponiveis = useMemo(() => {
        const unique = new Set(curriculos.map(c => c.cargo).filter(Boolean));
        return Array.from(unique).sort();
    }, [curriculos]);

    const filteredData = useMemo(() => {
        return curriculos.filter(i => {
            const matchStatus = statusTab === 'TODOS' || i.status === statusTab;
            const matchCargo = cargoFilter === 'TODOS' || i.cargo === cargoFilter;

            const term = debouncedSearch.toLowerCase();
            const matchSearch =
                (i.nome && i.nome.toLowerCase().includes(term)) ||
                (i.cargo && i.cargo.toLowerCase().includes(term)) ||
                (i.indicacao && i.indicacao.toLowerCase().includes(term));

            return matchStatus && matchCargo && matchSearch;
        });
    }, [curriculos, debouncedSearch, cargoFilter, statusTab]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, cargoFilter, statusTab]);

    // Derived KPIs
    const kpis = useMemo(() => {
        const total = curriculos.length;
        const pendentes = curriculos.filter(i => i.status === 'Pendente').length;
        const aprovados = curriculos.filter(i => i.status === 'Aprovado' || i.status === 'Contratado').length;
        const reprovados = curriculos.filter(i => i.status === 'Reprovado').length;
        return { total, pendentes, aprovados, reprovados };
    }, [curriculos]);

    const handleView = (item: Curriculo) => {
        openViewModal(
            'Detalhes do Currículo',
            <CurriculoDetails curriculo={item} />,
            {
                canEdit: true,
                canDelete: true,
                onEdit: () => openFormModal('Editar Currículo', <CurriculoForm initialData={item} onSuccess={refetch} />),
                onDelete: () => openConfirmModal('Excluir Currículo', 'Tem certeza que deseja excluir permanentemente o cadastro e arquivo deste candidato?', async () => {
                    await del(item.id);
                    showFeedback('success', 'Currículo excluído com sucesso!');
                }),
            }
        );
    };

    const columns = [
        {
            key: 'data',
            header: 'Dt. Cadastro',
            render: (i: Curriculo) => format(parseISO(i.data), "dd/MM/yyyy", { locale: ptBR })
        },
        {
            key: 'nome',
            header: 'Nome',
            render: (i: Curriculo) => <span className="font-semibold text-gray-900">{i.nome}</span>
        },
        {
            key: 'cargo',
            header: 'Vaga/Cargo',
            render: (i: Curriculo) => i.cargo
        },
        {
            key: 'empresa',
            header: 'Empresa',
            render: (i: Curriculo) => <CompanyBadge company={i.empresa} />
        },
        {
            key: 'status',
            header: 'Status',
            render: (i: Curriculo) => <CurriculoStatusBadge status={i.status} />
        },
        {
            key: 'arquivo',
            header: 'Arquivo',
            render: (i: Curriculo) => i.arquivo_url ? (
                <a
                    href={i.arquivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                    <FileText size={20} />
                </a>
            ) : <span className="text-gray-400">-</span>
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Currículos"
                subtitle="Banco de talentos e histórico de candidatos"
                action={
                    <div className="w-full sm:w-auto">
                        <PrimaryButton onClick={() => openFormModal('Novo Currículo', <CurriculoForm onSuccess={refetch} />)} className="w-full justify-center">
                            <Plus size={20} className="mr-2" /> Novo Currículo
                        </PrimaryButton>
                    </div>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total de Currículos" value={String(kpis.total)} type="total" icon={FileText} />
                <StatCard title="Pendentes" value={String(kpis.pendentes)} type="warning" icon={Clock} />
                <StatCard title="Aprovados / Contratados" value={String(kpis.aprovados)} type="success" icon={CheckCircle} />
                <StatCard title="Reprovados" value={String(kpis.reprovados)} type="danger" icon={XCircle} />
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, vaga ou indicação..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="w-full md:w-auto">
                    <select
                        value={cargoFilter}
                        onChange={e => setCargoFilter(e.target.value)}
                        className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full"
                    >
                        <option value="TODOS">Todos os Cargos</option>
                        {cargosDisponiveis.map(cargo => (
                            <option key={cargo} value={cargo}>{cargo}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex bg-white p-1 rounded-lg w-fit shadow-sm overflow-x-auto">
                {['TODOS', 'Pendente', 'Aprovado', 'Reprovado', 'Contratado'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setStatusTab(tab)}
                        className={`px-4 sm:px-6 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${statusTab === tab
                            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {tab === 'TODOS' ? 'Todos' : tab}
                    </button>
                ))}
            </div>

            <ResponsiveTable
                data={paginatedData}
                columns={columns}
                keyExtractor={i => i.id}
                onRowClick={handleView}
                loading={isLoading}
                skeletonRows={5}
                emptyMessage="Nenhum currículo encontrado."
                getRowBorderColor={i => i.empresa === 'FEMOG' ? 'border-blue-500' : 'border-orange-500'}
                renderCard={i => (
                    <div className={`border-l-4 pl-3 ${i.empresa === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
                        <div className="flex justify-between items-start mb-1">
                            <div className="font-bold text-gray-900">{i.nome}</div>
                            <CurriculoStatusBadge status={i.status} />
                        </div>
                        <div className="text-sm text-gray-500">{i.cargo}</div>
                        <div className="text-xs text-gray-400 mt-2 flex justify-between items-center">
                            <span>{format(parseISO(i.data), "dd/MM/yyyy")}</span>
                            {i.arquivo_url && (
                                <a
                                    href={i.arquivo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="text-blue-600 flex items-center"
                                >
                                    <FileText size={14} className="mr-1" /> Anexo
                                </a>
                            )}
                        </div>
                    </div>
                )}
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

export default Curriculos;
