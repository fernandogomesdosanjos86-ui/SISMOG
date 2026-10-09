import React, { useState } from 'react';
import { Plus, Search, FileText } from 'lucide-react';
import { useTrocasPosto } from '../hooks/useTrocasPosto';
import type { TrocaPosto as TrocaPostoType } from '../types';
import ResponsiveTable from '../../../components/ResponsiveTable';
import CompanyBadge from '../../../components/CompanyBadge';
import PageHeader from '../../../components/PageHeader';
import PrimaryButton from '../../../components/PrimaryButton';
import { useModal } from '../../../context/ModalContext';
import TrocaPostoForm from './TrocaPostoForm';
import TrocaPostoDetails from './TrocaPostoDetails';
import RelatorioTrocaPostoModal from '../components/RelatorioTrocaPostoModal';
import { useDebounce } from '../../../hooks/useDebounce';
import { formatDate } from '../../../utils/format';

const TrocaPosto: React.FC = () => {
    const { openFormModal, openViewModal, openConfirmModal, closeModal, showFeedback } = useModal();
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7));
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);

    const {
        trocas,
        isLoading,
        refetch,
        delete: deleteTroca
    } = useTrocasPosto({
        monthYear: selectedMonth,
        searchTerm: debouncedSearch
    });

    const handleCreate = () => {
        openFormModal('Nova Troca de Posto', <TrocaPostoForm onSuccess={refetch} />);
    };

    const handleOpenRelatorio = () => {
        openFormModal(
            'Relatório de Trocas de Posto',
            <RelatorioTrocaPostoModal
                onClose={closeModal}
                defaultCompetencia={selectedMonth}
            />
        );
    };

    const handleViewDetails = (troca: TrocaPostoType) => {
        const handleEdit = () => {
            closeModal();
            openFormModal('Editar Troca de Posto', <TrocaPostoForm initialData={troca} onSuccess={refetch} />);
        };

        const handleDelete = () => {
            openConfirmModal(
                'Excluir Troca de Posto',
                'Tem certeza que deseja excluir este registro de troca de posto? Esta ação não pode ser desfeita.',
                async () => {
                    try {
                        await deleteTroca(troca.id);
                        showFeedback('success', 'Troca de posto excluída com sucesso!');
                        closeModal();
                    } catch (error) {
                        console.error('Erro ao excluir:', error);
                        showFeedback('error', 'Erro ao excluir troca de posto.');
                    }
                }
            );
        };

        openViewModal(
            'Detalhes da Troca de Posto',
            <TrocaPostoDetails
                troca={troca}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />,
            {
                canEdit: true,
                canDelete: true,
                onEdit: handleEdit,
                onDelete: handleDelete
            }
        );
    };

    const columns = [
        {
            key: 'data_funcionario',
            header: 'Data / Funcionário',
            render: (t: TrocaPostoType) => (
                <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{formatDate(t.data)}</span>
                    <span className="text-xs text-blue-600 font-medium">por {t.funcionario?.nome || 'Não informado'}</span>
                </div>
            )
        },
        {
            key: 'posto_original',
            header: 'Posto Original',
            render: (t: TrocaPostoType) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{t.posto_original?.nome || '-'}</span>
                    <div className="mt-1"><CompanyBadge company={t.empresa} /></div>
                </div>
            )
        },
        {
            key: 'posto_cobertura',
            header: 'Posto Cobertura',
            render: (t: TrocaPostoType) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{t.posto_cobertura?.nome || '-'}</span>
                    <div className="mt-1"><CompanyBadge company={(t.posto_cobertura?.empresa as any) || t.empresa} /></div>
                </div>
            )
        },
        {
            key: 'observacoes',
            header: 'Observações',
            className: 'whitespace-normal min-w-[260px] max-w-xl break-words',
            render: (t: TrocaPostoType) => (
                <div className="text-sm text-gray-700 whitespace-normal break-words leading-relaxed py-1">
                    {t.observacoes || '-'}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Troca de Posto"
                subtitle="Registro de deslocamento operacional de funcionários entre postos"
                action={
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <input
                            type="month"
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto bg-white"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                        <PrimaryButton
                            variant="secondary"
                            onClick={handleOpenRelatorio}
                            className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
                            icon={<FileText size={18} />}
                        >
                            Relatório PDF
                        </PrimaryButton>
                        <PrimaryButton onClick={handleCreate} className="w-full sm:w-auto justify-center">
                            <Plus size={20} className="mr-2" /> Nova Troca de Posto
                        </PrimaryButton>
                    </div>
                }
            />

            {/* Pesquisa (sem KPI e sem filtros conforme solicitado) */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por funcionário, posto ou observação..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
            </div>

            {/* Tabela de Dados */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <ResponsiveTable
                    data={trocas}
                    columns={columns}
                    loading={isLoading}
                    keyExtractor={(t) => t.id}
                    onRowClick={handleViewDetails}
                    emptyMessage="Nenhuma troca de posto encontrada para este período."
                    getRowBorderColor={(t: any) => t.empresa === 'FEMOG' ? 'border-blue-500' : 'border-orange-500'}
                    renderCard={(t: TrocaPostoType) => (
                        <div
                            onClick={() => handleViewDetails(t)}
                            className={`cursor-pointer border-l-4 ${t.empresa === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'} pl-3 py-2 space-y-2`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <h3 className="font-bold text-gray-900 text-sm">{formatDate(t.data)}</h3>
                                    <span className="text-xs font-medium text-blue-600">por {t.funcionario?.nome || 'Não informado'}</span>
                                </div>
                                <CompanyBadge company={t.empresa} />
                            </div>
                            <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg space-y-1">
                                <p><span className="font-semibold text-gray-800">Original:</span> {t.posto_original?.nome || '-'}</p>
                                <p>
                                    <span className="font-semibold text-gray-800">Cobertura:</span> {t.posto_cobertura?.nome || '-'} {t.posto_cobertura?.empresa ? `(${t.posto_cobertura?.empresa})` : ''}
                                </p>
                                {t.observacoes && (
                                    <p className="pt-1 border-t border-gray-200 text-gray-700 italic">
                                        "{t.observacoes}"
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                />
            </div>
        </div>
    );
};

export default TrocaPosto;
