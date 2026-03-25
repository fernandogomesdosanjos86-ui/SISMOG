import React, { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useTrocasPlantao } from '../hooks/useTrocasPlantao';
import type { StatusTrocaPlantao } from '../types';
import ResponsiveTable from '../../../components/ResponsiveTable';
import StatCard from '../../../components/StatCard';
import CompanyBadge from '../../../components/CompanyBadge';
import PageHeader from '../../../components/PageHeader';
import PrimaryButton from '../../../components/PrimaryButton';
import { useModal } from '../../../context/ModalContext';
import { useAuth } from '../../../context/AuthContext';
import TrocaPlantaoForm from './TrocaPlantaoForm';
import TrocaPlantaoDetails from './TrocaPlantaoDetails';

type TabStatus = 'Todas' | StatusTrocaPlantao;
const TABS: TabStatus[] = ['Todas', 'Pendente', 'Em Análise', 'Cancelado', 'Autorizado', 'Negado'];

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        // Handle YYYY-MM-DD format
        if (dateString.length === 10) {
            return new Date(dateString + 'T12:00:00').toLocaleDateString('pt-BR');
        }
        // Handle full ISO strings
        const parsed = new Date(dateString);
        if (isNaN(parsed.getTime())) return '-';
        return parsed.toLocaleDateString('pt-BR');
    } catch {
        return '-';
    }
};

const TrocaPlantao: React.FC = () => {
    const { openFormModal, openViewModal, openConfirmModal } = useModal();
    const { user } = useAuth();
    
    // RBAC booleans
    const isOperador = user?.user_metadata?.permissao === 'Operador';
    const isGestor = user?.user_metadata?.permissao === 'Gestor';
    const isAdmin = user?.user_metadata?.permissao === 'Adm';
    const isManagement = isGestor || isAdmin;
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7));
    const [empresa, setEmpresa] = useState<'FEMOG' | 'SEMOG' | ''>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<TabStatus>('Todas');

    const {
        trocas,
        isLoading,
        delete: deleteTroca
    } = useTrocasPlantao({
        monthYear: selectedMonth,
        empresa: empresa || undefined,
        searchTerm
    });

    const filteredTrocas = useMemo(() => {
        if (activeTab === 'Todas') return trocas;
        return trocas.filter(t => t.status === activeTab);
    }, [trocas, activeTab]);

    const stats = useMemo(() => {
        const counts = { Pendente: 0, 'Em Análise': 0, Cancelado: 0, Autorizado: 0, Negado: 0 };
        trocas.forEach(t => { counts[t.status]++; });
        return counts;
    }, [trocas]);

    const handleCreate = () => {
        openFormModal('Nova Troca de Plantão', <TrocaPlantaoForm />);
    };

    const handleViewDetails = (troca: any) => {
        const isOwner = isOperador && troca.solicitante_id === user?.id;
        const canEdit = ((isOwner && troca.status === 'Pendente' && troca.de_acordo === null) || isManagement);
        const canDelete = isManagement;

        openViewModal(
            'Detalhes da Troca',
            <TrocaPlantaoDetails trocaId={troca.id} />,
            {
                canEdit,
                canDelete,
                onEdit: () => {
                    openFormModal('Editar Solicitação de Troca de Plantão', <TrocaPlantaoForm initialData={troca} />);
                },
                onDelete: () => {
                    openConfirmModal(
                        'Excluir Solicitação', 
                        'Tem certeza que deseja excluir esta solicitação de troca de plantão? Esta ação não pode ser desfeita.', 
                        () => deleteTroca(troca.id)
                    );
                }
            }
        );
    };

const TrocaStatusB = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        'Pendente': 'bg-amber-100 text-amber-800',
        'Em Análise': 'bg-blue-100 text-blue-800',
        'Autorizado': 'bg-green-100 text-green-800',
        'Negado': 'bg-red-100 text-red-800',
        'Cancelado': 'bg-gray-100 text-gray-800'
    };
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colors[status] || colors['Pendente']}`}>{status}</span>;
};

    const columns = [
        {
            key: 'data_original',
            header: 'Data Original / Substituto',
            render: (t: any) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{formatDate(t.data_original)}</span>
                    <span className="text-xs text-blue-600 font-medium">por {t.funcionario_troca?.nome}</span>
                </div>
            )
        },
        {
            key: 'reposicao',
            header: 'Data Reposição / Funcionário',
            render: (t: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{formatDate(t.data_reposicao)}</span>
                    <span className="text-xs text-gray-500">{t.funcionario?.nome}</span>
                </div>
            )
        },
        {
            key: 'posto_empresa',
            header: 'Posto / Empresa',
            render: (t: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{t.posto?.nome}</span>
                    <div className="mt-1"><CompanyBadge company={t.empresa} /></div>
                </div>
            )
        },
        {
            key: 'solicitacao',
            header: 'Data Solicitação / Solicitante',
            render: (t: any) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{formatDate(t.data_solicitacao)}</span>
                    <span className="text-xs text-gray-500">{t.solicitante?.nome}</span>
                </div>
            )
        },
        { key: 'status', header: 'Status', render: (t: any) => <TrocaStatusB status={t.status} /> }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Troca de Plantão"
                subtitle="Gestão de substituições e trocas de postos entre funcionários"
                action={
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <input
                            type="month"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                        <PrimaryButton onClick={handleCreate} className="w-full sm:w-auto justify-center">
                            <Plus size={20} className="mr-2" /> Nova Solicitação
                        </PrimaryButton>
                    </div>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <StatCard title="Pendentes" value={stats.Pendente.toString()} type="warning" />
                <StatCard title="Em Análise" value={stats['Em Análise'].toString()} type="info" />
                <StatCard title="Autorizadas" value={stats.Autorizado.toString()} type="success" />
                <StatCard title="Negadas" value={stats.Negado.toString()} type="danger" />
                <StatCard title="Canceladas" value={stats.Cancelado.toString()} type="total" />
            </div>

            {/* Filters - Top Bar (Search + Status) */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por funcionário, solicitante ou posto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div className="w-full md:w-auto flex gap-2">
                    <select
                        value={empresa}
                        onChange={(e) => setEmpresa(e.target.value as any)}
                        className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm w-full md:w-auto"
                    >
                        <option value="">Todas as Empresas</option>
                        <option value="FEMOG">FEMOG</option>
                        <option value="SEMOG">SEMOG</option>
                    </select>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white p-1 rounded-lg w-fit shadow-sm max-w-full overflow-x-auto">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`whitespace-nowrap px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab
                            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <ResponsiveTable
                    data={filteredTrocas}
                    columns={columns}
                    loading={isLoading}
                    keyExtractor={(t) => t.id}
                    onRowClick={handleViewDetails}
                    emptyMessage="Nenhuma troca de plantão encontrada."
                    getRowBorderColor={(t: any) => t.empresa === 'FEMOG' ? 'border-blue-500' : 'border-orange-500'}
                    renderCard={(t: any) => (
                        <div onClick={() => handleViewDetails(t)} className={`cursor-pointer border-l-4 ${t.empresa === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'} pl-3 py-1`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col">
                                    <h3 className="font-bold text-gray-900 text-sm">Orig: {formatDate(t.data_original)}</h3>
                                    <span className="text-xs font-medium text-blue-600">Subst: {t.funcionario_troca?.nome}</span>
                                </div>
                                <TrocaStatusB status={t.status} />
                            </div>
                            <div className="text-sm text-gray-600 space-y-1 mb-3 bg-gray-50 p-2 rounded-lg">
                                <div className="flex flex-col">
                                    <p className="font-semibold text-gray-800 text-xs">Reposição:</p>
                                    <p className="text-sm">{formatDate(t.data_reposicao)} - {t.funcionario?.nome}</p>
                                </div>
                                <p><span className="font-semibold text-gray-800 text-xs">Posto:</span> {t.posto?.nome}</p>
                                <p className="text-[11px] mt-1 pt-1 border-t border-gray-200">
                                    Solicitado em {formatDate(t.data_solicitacao)} por {t.solicitante?.nome}
                                </p>
                            </div>
                            <CompanyBadge company={t.empresa} />
                        </div>
                    )}
                />
            </div>
        </div>
    );
};

export default TrocaPlantao;
