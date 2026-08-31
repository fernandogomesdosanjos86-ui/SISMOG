import React, { useState, useMemo } from 'react';
import { Plus, Search, Settings } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ResponsiveTable from '../../components/ResponsiveTable';
import { useModal } from '../../context/ModalContext';
import { useParametrosFolha } from './hooks/useParametrosFolha';
import type { ParametrosFolha } from './types';
import ParametrosFolhaForm from './components/ParametrosFolhaForm';
import ParametrosFolhaDetails from './components/ParametrosFolhaDetails';
import { formatCurrency } from '../../utils/format';
import PrimaryButton from '../../components/PrimaryButton';

const ParametrosFolhaPage: React.FC = () => {
    const { openConfirmModal, openFormModal, openViewModal, closeModal, showFeedback } = useModal();
    const { parametrosFolha, isLoading, refetch, delete: deleteParametros } = useParametrosFolha();
    const [searchTerm, setSearchTerm] = useState('');

    const handleCreate = () => {
        openFormModal('Novo Parâmetro de Folha', <ParametrosFolhaForm onSuccess={refetch} />);
    };

    const handleEdit = (item: ParametrosFolha) => {
        openFormModal(
            `Editar Parâmetro - Ano ${item.ano}`,
            <ParametrosFolhaForm initialData={item} onSuccess={refetch} />
        );
    };

    const handleDelete = async (id: string, ano: number) => {
        openConfirmModal(
            'Excluir Parâmetros',
            `Tem certeza que deseja excluir os parâmetros da folha do ano ${ano}? Esta ação não pode ser desfeita.`,
            async () => {
                try {
                    await deleteParametros(id);
                    showFeedback('success', 'Parâmetros excluídos com sucesso!');
                    refetch();
                    closeModal();
                } catch (error) {
                    console.error('Erro ao excluir parâmetros:', error);
                    showFeedback('error', 'Erro ao excluir parâmetros.');
                }
            }
        );
    };

    const handleRowClick = (item: ParametrosFolha) => {
        openViewModal(
            `Parâmetros Folha - Ano ${item.ano}`,
            <ParametrosFolhaDetails parametros={item} />,
            {
                canEdit: true,
                canDelete: true,
                onEdit: () => handleEdit(item),
                onDelete: () => handleDelete(item.id, item.ano)
            }
        );
    };

    const filteredParametros = useMemo(() => {
        return parametrosFolha.filter(item => {
            const yearStr = String(item.ano);
            return yearStr.includes(searchTerm);
        });
    }, [parametrosFolha, searchTerm]);

    const columns = [
        {
            header: 'Ano Base',
            key: 'ano',
            render: (item: ParametrosFolha) => (
                <div className="font-semibold text-gray-900 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-500" />
                    {item.ano}
                </div>
            )
        },
        {
            header: 'Salário Mínimo',
            key: 'valor_salario_minimo',
            render: (item: ParametrosFolha) => (
                <div className="font-medium text-gray-900">
                    {formatCurrency(item.valor_salario_minimo)}
                </div>
            )
        },
        {
            header: 'Teto Salário Família',
            key: 'teto_salario_familia',
            render: (item: ParametrosFolha) => (
                <div className="text-gray-900">
                    {formatCurrency(item.teto_salario_familia)}
                </div>
            )
        },
        {
            header: 'Valor Salário Família',
            key: 'valor_salario_familia',
            render: (item: ParametrosFolha) => (
                <div className="text-gray-900">
                    {formatCurrency(item.valor_salario_familia)}
                </div>
            )
        }
    ];

    const renderCard = (item: ParametrosFolha) => (
        <div className="flex flex-col gap-2 relative border-l-4 pl-3 border-l-blue-500">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-gray-900">Ano Base: {item.ano}</h3>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t mt-1">
                <div>
                    <span className="text-gray-500 block">Salário Mínimo</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(item.valor_salario_minimo)}</span>
                </div>
                <div>
                    <span className="text-gray-500 block">Valor Sal. Família</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(item.valor_salario_familia)}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Parâmetros Folha"
                subtitle="Gerencie os valores de salário mínimo, faixas de INSS e salário família."
                action={
                    <PrimaryButton
                        onClick={handleCreate}
                        icon={<Plus size={20} />}
                        className="w-full md:w-auto"
                    >
                        Novo Parâmetro
                    </PrimaryButton>
                }
            />

            {/* Filter bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por ano..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <ResponsiveTable<ParametrosFolha>
                data={filteredParametros}
                columns={columns}
                onRowClick={handleRowClick}
                emptyMessage="Nenhum parâmetro de folha cadastrado."
                renderCard={renderCard}
                keyExtractor={(item) => item.id}
                loading={isLoading}
                getRowBorderColor={() => 'border-blue-500'}
            />
        </div>
    );
};

export default ParametrosFolhaPage;
