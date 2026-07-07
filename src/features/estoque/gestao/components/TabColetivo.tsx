import React, { useState, useEffect } from 'react';
import { Trash } from 'lucide-react';
import ResponsiveTable from '../../../../components/ResponsiveTable';
import { useModal } from '../../../../context/ModalContext';
import { estoqueGestaoService } from '../../../../services/estoqueGestaoService';
import type { Movimentacao, ResumoPosto, MovimentacaoFormData } from '../types';
import { MovimentacaoDetails } from './TabCompraDescarte';
import MovimentacaoForm from './MovimentacaoForm';

interface TabColetivoProps {
    onRefresh: () => void;
    deleteMov: (id: string) => Promise<any>;
    updateMov: (args: { id: string; data: Partial<MovimentacaoFormData> }) => Promise<any>;
    searchTerm: string;
}

const TabColetivo: React.FC<TabColetivoProps> = ({ onRefresh, deleteMov, updateMov, searchTerm }) => {
    const { openViewModal } = useModal();
    const [resumo, setResumo] = useState<ResumoPosto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    const loadResumo = async () => {
        setIsLoading(true);
        try {
            const data = await estoqueGestaoService.getResumoPorPosto();
            setResumo(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadResumo(); }, []);
    useEffect(() => { loadResumo(); }, [onRefresh]);

    const normalizeSearch = (str: string) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';

    const filtered = resumo.filter(r =>
        normalizeSearch(r.nome).includes(normalizeSearch(searchTerm))
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handleView = (item: ResumoPosto) => {
        openViewModal(
            'Detalhes da Distribuição',
            <HistoricoPostoModal
                postoId={item.id}
                nome={item.nome}
                empresa={item.empresa}
                qtdTotal={item.qtd}
                onParentRefresh={loadResumo}
                deleteMov={deleteMov}
                updateMov={updateMov}
            />
        );
    };

    const columns = [
        {
            key: 'nome', header: 'Posto', render: (r: ResumoPosto) => (
                <span className="font-medium text-gray-900">{r.nome} - {r.empresa}</span>
            )
        },
        {
            key: 'qtd', header: 'Qtd Itens no Posto', render: (r: ResumoPosto) => (
                <span className="font-bold text-green-700">{r.qtd}</span>
            )
        },
    ];

    const renderCard = (r: ResumoPosto) => (
        <div className="flex justify-between items-center" onClick={() => handleView(r)}>
            <div>
                <p className="font-bold text-gray-900 text-sm">{r.nome}</p>
                <span className="text-xs text-gray-500">{r.empresa}</span>
            </div>
            <span className="text-lg font-bold text-green-700">{r.qtd}</span>
        </div>
    );

    return (
        <div className="space-y-4">
            <ResponsiveTable
                data={paginated}
                columns={columns}
                keyExtractor={r => r.id}
                onRowClick={handleView}
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

const HistoricoPostoModal: React.FC<{
    postoId: string;
    nome: string;
    empresa: string;
    qtdTotal: number;
    onParentRefresh: () => void;
    deleteMov: (id: string) => Promise<any>;
    updateMov: (args: { id: string; data: Partial<MovimentacaoFormData> }) => Promise<any>;
}> = ({ postoId, nome, empresa, qtdTotal, onParentRefresh, deleteMov, updateMov }) => {
    const { openViewModal, openFormModal, openConfirmModal, closeModal } = useModal();
    const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
    const [loading, setLoading] = useState(true);

    const loadMovs = async () => {
        setLoading(true);
        try {
            const data = await estoqueGestaoService.getMovimentacoesPorPosto(postoId);
            setMovimentacoes(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMovs();
    }, [postoId]);

    const handleDelete = (id: string) => {
        openConfirmModal(
            'Excluir Movimentação',
            'Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.',
            async () => {
                await deleteMov(id);
                loadMovs();
                onParentRefresh();
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
                        onSuccess={() => { loadMovs(); onParentRefresh(); }}
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
                            loadMovs();
                            onParentRefresh();
                            closeModal();
                        } catch (error) {
                            // Handled by hook
                        }
                    }
                )
            }
        );
    };

    return (
        <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Posto</p>
                        <p className="font-bold text-gray-900">{nome}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Empresa</p>
                        <p className="font-bold text-gray-900">{empresa}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase">Itens no Posto</p>
                        <p className="text-xl font-bold text-green-700">{qtdTotal}</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="py-8 text-center text-gray-400">Carregando histórico...</div>
            ) : (
                <>
                    <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qtd</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observação</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {movimentacoes.map(m => {
                                    const dateStr = m.data.split('T')[0];
                                    const [year, month, day] = dateStr.split('-');
                                    const formattedDate = `${day}/${month}/${year}`;

                                    return (
                                        <tr key={m.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(m)}>
                                            <td className="px-4 py-3 text-sm font-medium">{m.produto?.codigo}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${m.tipo === 'Entrega' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                    }`}>{m.tipo}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-center font-bold">{m.quantidade}</td>
                                            <td className="px-4 py-3 text-sm">{formattedDate}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{m.observacao || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-right" onClick={(e) => e.stopPropagation()}>
                                                <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:text-red-900 p-1" title="Excluir">
                                                    <Trash size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {movimentacoes.length === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nenhuma movimentação</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="sm:hidden space-y-3">
                        {movimentacoes.map(m => {
                            const dateStr = m.data.split('T')[0];
                            const [year, month, day] = dateStr.split('-');
                            const formattedDate = `${day}/${month}/${year}`;

                            return (
                                <div key={m.id} className="bg-white border text-sm border-gray-200 p-3 rounded-xl shadow-sm relative cursor-pointer" onClick={() => handleRowClick(m)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-gray-900">{m.produto?.codigo}</p>
                                            <p className="text-xs text-gray-400">{formattedDate}</p>
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] rounded-full font-medium ${m.tipo === 'Entrega' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            }`}>{m.tipo}</span>
                                    </div>

                                    <div className="flex justify-between items-center mt-3">
                                        <p className="text-gray-600"><span className="font-semibold">{m.quantidade}</span> itens</p>
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg" title="Excluir">
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {m.observacao && (
                                        <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-2">{m.observacao}</p>
                                    )}
                                </div>
                            );
                        })}
                        {movimentacoes.length === 0 && (
                            <div className="py-8 text-center text-gray-400 border border-dashed rounded-xl">Nenhuma movimentação</div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TabColetivo;
