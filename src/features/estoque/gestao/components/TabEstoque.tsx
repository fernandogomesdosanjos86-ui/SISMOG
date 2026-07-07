import React, { useState } from 'react';
import ResponsiveTable from '../../../../components/ResponsiveTable';
import type { Produto, ProdutoFormData } from '../types';
import { useModal } from '../../../../context/ModalContext';
import { Info, Tag, Activity } from 'lucide-react';
import ProdutoForm from './ProdutoForm';

interface TabEstoqueProps {
    produtos: (Produto & { em_estoque: number })[];
    isLoading: boolean;
    searchTerm: string;
    tipoFilter: 'TODOS' | 'Individual' | 'Coletivo';
    onRefresh: () => void;
    create: (data: ProdutoFormData) => Promise<any>;
    update: (args: { id: string; data: ProdutoFormData }) => Promise<any>;
    deleteProduto: (id: string) => Promise<any>;
}

const TabEstoque: React.FC<TabEstoqueProps> = ({
    produtos,
    isLoading,
    searchTerm,
    tipoFilter,
    onRefresh,
    create,
    update,
    deleteProduto,
}) => {
    const { openViewModal, openFormModal, openConfirmModal, closeModal } = useModal();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const normalizeSearch = (str: string) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';

    const filtered = produtos.filter(p => {
        const matchesTipo = tipoFilter === 'TODOS' || p.tipo === tipoFilter;
        const matchesSearch = normalizeSearch(p.codigo).includes(normalizeSearch(searchTerm));
        return matchesTipo && matchesSearch;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, tipoFilter]);

    const handleRowClick = (p: Produto & { em_estoque: number }) => {
        openViewModal(
            'Detalhes do Produto',
            <ProdutoDetails produto={p} />,
            {
                canEdit: true,
                editText: 'Editar',
                onEdit: () => openFormModal('Editar Produto', (
                    <ProdutoForm
                        initialData={p}
                        onSuccess={onRefresh}
                        create={create}
                        update={update}
                    />
                )),
                canDelete: true,
                deleteText: 'Excluir',
                onDelete: () => openConfirmModal(
                    'Excluir Produto',
                    `Tem certeza que deseja excluir o produto ${p.codigo}? Esta ação não pode ser desfeita.`,
                    async () => {
                        try {
                            await deleteProduto(p.id);
                            onRefresh();
                            closeModal();
                        } catch (error) {
                            // Feedback is handled by mutation hook
                        }
                    }
                )
            }
        );
    };

    const columns = [
        {
            key: 'codigo', header: 'Código', render: (p: Produto & { em_estoque: number }) => (
                <span className="font-medium text-gray-900">{p.codigo}</span>
            )
        },
        {
            key: 'tipo', header: 'Tipo', render: (p: Produto & { em_estoque: number }) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.tipo === 'Individual' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>{p.tipo}</span>
            )
        },
        {
            key: 'em_estoque', header: 'Em Estoque', render: (p: Produto & { em_estoque: number }) => (
                <span className={`font-bold ${p.em_estoque > 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {p.em_estoque}
                </span>
            )
        },
    ];

    const renderCard = (p: Produto & { em_estoque: number }) => (
        <div className="flex justify-between items-center" onClick={() => handleRowClick(p)}>
            <div>
                <p className="font-bold text-gray-900 text-sm">{p.codigo}</p>
                <span className={`inline-flex items-center px-2 py-0.5 text-[10px] rounded-full font-medium ${p.tipo === 'Individual' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>{p.tipo}</span>
            </div>
            <span className={`text-lg font-bold ${p.em_estoque > 0 ? 'text-green-700' : 'text-red-600'}`}>
                {p.em_estoque}
            </span>
        </div>
    );

    return (
        <div className="space-y-4">
            {/* Table */}
            <ResponsiveTable
                data={paginated}
                columns={columns}
                keyExtractor={p => p.id}
                onRowClick={handleRowClick}
                loading={isLoading}
                skeletonRows={5}
                renderCard={renderCard}
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

const ProdutoDetails: React.FC<{ produto: Produto & { em_estoque: number } }> = ({ produto }) => (
    <div className="space-y-6">
        <div className="flex items-start justify-between border-b border-gray-100 pb-5">
            <div>
                <h3 className="text-xl font-bold text-gray-900">{produto.produto}</h3>
                <p className="text-sm text-gray-500 mt-1">{produto.codigo}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    <Tag size={16} className="mr-2" /> Tipo
                </div>
                <div className="text-gray-900 font-semibold text-lg">{produto.tipo}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    <Activity size={16} className="mr-2" /> Cor
                </div>
                <div className="text-gray-900 font-semibold text-lg">{produto.cor || '-'}</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    <Activity size={16} className="mr-2" /> Tamanho
                </div>
                <div className="text-gray-900 font-semibold text-lg font-mono">{produto.tamanho || '-'}</div>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col gap-2 ${produto.em_estoque <= 0 ? 'bg-red-50/50 border-red-100' : 'bg-blue-50/50 border-blue-100'}`}>
                <div className={`flex items-center text-sm font-medium mb-1 ${produto.em_estoque <= 0 ? 'text-red-700' : 'text-blue-700'}`}>
                    <Info size={16} className="mr-2" /> Em Estoque
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${produto.em_estoque <= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {produto.em_estoque}
                    </span>
                </div>
            </div>
        </div>
    </div>
);

export default TabEstoque;
