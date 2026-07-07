import React, { useState } from 'react';
import { Trash, Info, Tag, Activity } from 'lucide-react';
import ResponsiveTable from '../../../../components/ResponsiveTable';
import { useModal } from '../../../../context/ModalContext';
import type { Movimentacao, MovimentacaoFormData } from '../types';
import MovimentacaoForm from './MovimentacaoForm';

interface TabCompraDescarteProps {
    movimentacoes: Movimentacao[];
    isLoading: boolean;
    deleteMov: (id: string) => Promise<any>;
    updateMov: (args: { id: string; data: Partial<MovimentacaoFormData> }) => Promise<any>;
    onRefresh: () => void;
    searchTerm: string;
    tipoFilter: 'TODOS' | 'Compra' | 'Descarte';
}

const TabCompraDescarte: React.FC<TabCompraDescarteProps> = ({
    movimentacoes,
    isLoading,
    deleteMov,
    updateMov,
    onRefresh,
    searchTerm,
    tipoFilter,
}) => {
    const { openViewModal, openFormModal, openConfirmModal, closeModal } = useModal();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const compraDescarte = movimentacoes.filter(m => m.tipo === 'Compra' || m.tipo === 'Descarte');

    const filtered = compraDescarte.filter(m => {
        const matchesTipo = tipoFilter === 'TODOS' || m.tipo === tipoFilter;
        const matchesSearch = (m.produto?.codigo || '').toLowerCase().includes(searchTerm.toLowerCase());
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

    const handleDelete = (id: string) => {
        openConfirmModal(
            'Excluir Movimentação',
            'Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.',
            async () => {
                await deleteMov(id);
                onRefresh();
            }
        );
    };

    const handleRowClick = (m: Movimentacao) => {
        openViewModal(
            'Detalhes da Movimentação',
            <MovimentacaoDetails movimentacao={m} />,
            {
                canEdit: true,
                editText: 'Editar',
                onEdit: () => openFormModal('Editar Movimentação', (
                    <MovimentacaoForm
                        initialData={m}
                        onSuccess={onRefresh}
                        create={async () => {}}
                        update={updateMov}
                    />
                )),
                canDelete: true,
                deleteText: 'Excluir',
                onDelete: () => openConfirmModal(
                    'Excluir Movimentação',
                    'Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.',
                    async () => {
                        try {
                            await deleteMov(m.id);
                            onRefresh();
                            closeModal();
                        } catch (error) {
                            // Handled by hook
                        }
                    }
                )
            }
        );
    };

    const columns = [
        {
            key: 'codigo', header: 'Código', render: (m: Movimentacao) => (
                <span className="font-medium text-gray-900">{m.produto?.codigo}</span>
            )
        },
        {
            key: 'tipo', header: 'Tipo', render: (m: Movimentacao) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${m.tipo === 'Compra' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>{m.tipo}</span>
            )
        },
        {
            key: 'quantidade', header: 'Quantidade', render: (m: Movimentacao) => (
                <span className="font-bold">{m.quantidade}</span>
            )
        },
        {
            key: 'data', header: 'Data', render: (m: Movimentacao) => (
                new Date(m.data).toLocaleDateString('pt-BR')
            )
        },
        {
            key: 'observacao', header: 'Observação', render: (m: Movimentacao) => (
                <span className="text-gray-500">{m.observacao || '-'}</span>
            )
        },
        {
            key: 'acoes', header: 'Ações', render: (m: Movimentacao) => (
                <button onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }} className="text-red-600 hover:text-red-900 p-1" title="Excluir">
                    <Trash size={16} />
                </button>
            )
        },
    ];

    const renderCard = (m: Movimentacao) => (
        <div onClick={() => handleRowClick(m)}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="font-bold text-gray-900 text-sm">{m.produto?.codigo}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] rounded-full font-medium ${m.tipo === 'Compra' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>{m.tipo}</span>
                </div>
                <div className="text-right">
                    <p className="font-bold text-gray-900">{m.quantidade} un</p>
                    <p className="text-xs text-gray-500">{new Date(m.data).toLocaleDateString('pt-BR')}</p>
                </div>
            </div>
            {m.observacao && <p className="text-xs text-gray-500 mt-1">{m.observacao}</p>}
        </div>
    );

    return (
        <div className="space-y-4">
            <ResponsiveTable
                data={paginated}
                columns={columns}
                keyExtractor={m => m.id}
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

export const MovimentacaoDetails: React.FC<{ movimentacao: Movimentacao }> = ({ movimentacao }) => {
    const formattedDate = new Date(movimentacao.data).toLocaleDateString('pt-BR');
    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{movimentacao.produto?.codigo || 'Produto'}</h3>
                    <p className="text-sm text-gray-500 mt-1">{movimentacao.tipo}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <Tag size={16} className="mr-2" /> Tipo Movimentação
                    </div>
                    <div className="text-gray-900 font-semibold text-lg">{movimentacao.tipo}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <Info size={16} className="mr-2" /> Quantidade
                    </div>
                    <div className="text-gray-900 font-semibold text-lg">{movimentacao.quantidade} un</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <Activity size={16} className="mr-2" /> Data
                    </div>
                    <div className="text-gray-900 font-semibold text-lg">{formattedDate}</div>
                </div>

                {movimentacao.funcionario && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2 sm:col-span-2">
                        <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                            <Activity size={16} className="mr-2" /> Funcionário
                        </div>
                        <div className="text-gray-900 font-semibold text-lg">{movimentacao.funcionario.nome} ({movimentacao.funcionario.empresa})</div>
                    </div>
                )}

                {movimentacao.posto && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2 sm:col-span-2">
                        <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                            <Activity size={16} className="mr-2" /> Posto
                        </div>
                        <div className="text-gray-900 font-semibold text-lg">{movimentacao.posto.nome} ({movimentacao.posto.empresa})</div>
                    </div>
                )}

                {movimentacao.observacao && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2 sm:col-span-2">
                        <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                            <Info size={16} className="mr-2" /> Observação
                        </div>
                        <div className="text-gray-900 font-semibold text-sm">{movimentacao.observacao}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TabCompraDescarte;
