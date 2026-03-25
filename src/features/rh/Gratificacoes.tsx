import React, { useState } from 'react';
import { Plus, Search, Award } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import ResponsiveTable from '../../components/ResponsiveTable';
import StatCard from '../../components/StatCard';
import CompanyBadge from '../../components/CompanyBadge';
import { useModal } from '../../context/ModalContext';
import { useDebounce } from '../../hooks/useDebounce';
import { useGratificacoes } from './hooks/useGratificacoes';
import GratificacaoForm from './components/GratificacaoForm';
import GratificacaoDetails from './components/GratificacaoDetails';
import type { Gratificacao } from './types';

import { normalizeSearchString } from '../../utils/normalization';

const Gratificacoes: React.FC = () => {
    const { gratificacoes, isLoading, deleteGratificacao } = useGratificacoes();
    const { openConfirmModal, openFormModal, openViewModal, closeModal } = useModal();

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [companyFilter, setCompanyFilter] = useState<'TODOS' | 'FEMOG' | 'SEMOG'>('TODOS');
    const [tipoFilter, setTipoFilter] = useState<'TODOS' | 'Folha de Pagamento' | 'Incentivo'>('TODOS');

    // Filtros Locais
    const filteredData = gratificacoes.filter(g => {
        const matchesCompany = companyFilter === 'TODOS' || g.empresa === companyFilter;
        const matchesTipo = tipoFilter === 'TODOS' || g.tipo === tipoFilter;
        const matchesSearch = normalizeSearchString(g.funcionario?.nome).includes(normalizeSearchString(debouncedSearch));
        return matchesCompany && matchesTipo && matchesSearch;
    });

    // Grouping logic por funcionário id
    const groups = filteredData.reduce((acc, gratificacao) => {
        const key = gratificacao.funcionario_id;
        if (!acc[key]) {
            acc[key] = {
                funcionario_id: key,
                funcionario_nome: gratificacao.funcionario?.nome || 'Desconhecido',
                empresa: gratificacao.empresa,
                registros: []
            };
        }
        acc[key].registros.push(gratificacao);
        return acc;
    }, {} as Record<string, { funcionario_id: string, funcionario_nome: string, empresa: 'FEMOG' | 'SEMOG', registros: Gratificacao[] }>);

    const groupedArray = Object.values(groups).sort((a, b) => a.funcionario_nome.localeCompare(b.funcionario_nome));

    const handleCreate = () => {
        openFormModal('Novo Registro', <GratificacaoForm />);
    };

    const handleEdit = (gratificacao: Gratificacao) => {
        openFormModal('Editar Registro', <GratificacaoForm initialData={gratificacao} onSuccess={closeModal} />);
    };

    const handleDelete = (gratificacao: Gratificacao) => {
        openConfirmModal(
            'Excluir Registro',
            `Tem certeza que deseja excluir o registro de ${gratificacao.tipo} de ${gratificacao.funcionario?.nome}?`,
            async () => {
                await deleteGratificacao(gratificacao.id);
                closeModal(); // Also close details modal if open
            }
        );
    };

    const handleViewDetails = (grupo: typeof groupedArray[0]) => {
        openViewModal(
            'Detalhes da Gratificação',
            <GratificacaoDetails
                employeeName={grupo.funcionario_nome}
                gratificacoes={grupo.registros}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        );
    };

    // KPIs
    const totalGratificacoes = gratificacoes.length;
    const totalFemog = gratificacoes.filter(g => g.empresa === 'FEMOG').length;
    const totalSemog = gratificacoes.filter(g => g.empresa === 'SEMOG').length;

    // Componente customizado para a linha expandida no mobile (ou details view)
    const renderCard = (grupo: any) => (
        <div className={`border-l-4 pl-3 py-1 ${grupo.empresa === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-bold text-gray-900">{grupo.funcionario_nome}</h4>
                    <div className="mt-1.5">
                        <CompanyBadge company={grupo.empresa} />
                    </div>
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {grupo.registros.length} reg.
                </span>
            </div>
        </div>
    );

    const columns = [
        {
            key: 'funcionario',
            header: 'Funcionário',
            render: (i: any) => (
                <div className="font-medium text-gray-900">{i.funcionario_nome}</div>
            )
        },
        {
            key: 'empresa',
            header: 'Empresa',
            render: (i: any) => (
                <CompanyBadge company={i.empresa} />
            )
        },
        {
            key: 'qtd',
            header: 'Qtd. Registros',
            render: (i: any) => (
                <div className="text-gray-500 text-sm">{i.registros.length} registro(s)</div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Gratificações"
                subtitle="Registro de gratificações em folha de pagamento e incentivos."
                action={
                    <div className="w-full sm:w-auto">
                        <PrimaryButton onClick={handleCreate} icon={<Plus size={20} />} className="w-full">
                            Novo Registro
                        </PrimaryButton>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard
                    title="Total Geral"
                    value={String(totalGratificacoes)}
                    type="total"
                    icon={Award}
                />
                <StatCard
                    title="Total FEMOG"
                    value={String(totalFemog)}
                    type="info"
                    icon={Award}
                />
                <StatCard
                    title="Total SEMOG"
                    value={String(totalSemog)}
                    type="warning"
                    icon={Award}
                />
            </div>

            {/* Filters - Top Bar (Search + Tipo) */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar funcionário..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-auto">
                    <select
                        className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm w-full"
                        value={tipoFilter}
                        onChange={(e) => setTipoFilter(e.target.value as any)}
                    >
                        <option value="TODOS">Todos os Tipos</option>
                        <option value="Folha de Pagamento">Folha de Pagamento</option>
                        <option value="Incentivo">Incentivo</option>
                    </select>
                </div>
            </div>

            {/* Filters - Bottom Bar (Tabs) */}
            <div className="flex bg-white p-1 rounded-lg w-fit shadow-sm overflow-x-auto mb-4">
                {(['TODOS', 'FEMOG', 'SEMOG'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setCompanyFilter(tab)}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${companyFilter === tab
                            ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {tab === 'TODOS' ? 'Todas' : tab}
                    </button>
                ))}
            </div>

            <ResponsiveTable
                data={groupedArray}
                columns={columns}
                emptyMessage="Nenhum registro encontrado."
                renderCard={renderCard}
                onRowClick={handleViewDetails}
                keyExtractor={(item) => item.funcionario_id}
                loading={isLoading}
                getRowBorderColor={(item) => item.empresa === 'FEMOG' ? 'border-blue-500' : 'border-orange-500'}
            />
        </div>
    );
};

export default Gratificacoes;
