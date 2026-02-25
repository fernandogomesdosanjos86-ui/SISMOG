import React, { useState } from 'react';
import { Trash } from 'lucide-react';
import ResponsiveTable from '../../../../components/ResponsiveTable';
import { useModal } from '../../../../context/ModalContext';
import { estoqueGestaoService } from '../../../../services/estoqueGestaoService';
import type { Movimentacao, ResumoPosto } from '../types';

interface TabColetivoProps {
    onRefresh: () => void;
    deleteMov: (id: string) => Promise<any>;
    searchTerm: string;
}

const ITEMS_PER_PAGE = 50;

const TabColetivo: React.FC<TabColetivoProps> = ({ onRefresh, deleteMov, searchTerm }) => {
    const { openViewModal, showFeedback } = useModal();
    const [resumo, setResumo] = useState<ResumoPosto[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    React.useEffect(() => { loadResumo(); }, []);
    React.useEffect(() => { loadResumo(); }, [onRefresh]);

    const filtered = resumo.filter(r =>
        r.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleView = async (item: ResumoPosto) => {
        try {
            const movs = await estoqueGestaoService.getMovimentacoesPorPosto(item.id);
            openViewModal(
                `Histórico: ${item.nome}`,
                <HistoricoPostoModal
                    nome={item.nome}
                    empresa={item.empresa}
                    qtdTotal={item.qtd}
                    movimentacoes={movs}
                    onDelete={async (id) => {
                        await deleteMov(id);
                        onRefresh();
                    }}
                />
            );
        } catch {
            showFeedback('error', 'Erro ao carregar histórico.');
        }
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
        <div className="flex justify-between items-center">
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
                data={filtered.slice(0, ITEMS_PER_PAGE)}
                columns={columns}
                keyExtractor={r => r.id}
                onRowClick={handleView}
                loading={isLoading}
                skeletonRows={5}
                renderCard={renderCard}
            />
        </div>
    );
};

const HistoricoPostoModal: React.FC<{
    nome: string;
    empresa: string;
    qtdTotal: number;
    movimentacoes: Movimentacao[];
    onDelete: (id: string) => Promise<void>;
}> = ({ nome, empresa, qtdTotal, movimentacoes, onDelete }) => {
    const { openConfirmModal } = useModal();

    const handleDelete = (id: string) => {
        openConfirmModal(
            'Excluir Movimentação',
            'Tem certeza que deseja excluir esta movimentação?',
            () => onDelete(id)
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
                                <tr key={m.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium">{m.produto?.codigo}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-1 text-xs rounded-full font-bold ${m.tipo === 'Entrega' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            }`}>{m.tipo}</span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center font-bold">{m.quantidade}</td>
                                    <td className="px-4 py-3 text-sm">{formattedDate}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{m.observacao || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-right">
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
                        <div key={m.id} className="bg-white border text-sm border-gray-200 p-3 rounded-xl shadow-sm relative">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-gray-900">{m.produto?.codigo}</p>
                                    <p className="text-xs text-gray-400">{formattedDate}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full font-bold ${m.tipo === 'Entrega' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                    }`}>{m.tipo}</span>
                            </div>

                            <div className="flex justify-between items-center mt-3">
                                <p className="text-gray-600"><span className="font-semibold">{m.quantidade}</span> itens</p>
                                <button onClick={() => handleDelete(m.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg" title="Excluir">
                                    <Trash size={16} />
                                </button>
                            </div>

                            {m.observacao && (
                                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-2 mt-2">{m.observacao}</p>
                            )}
                        </div>
                    );
                })}
                {movimentacoes.length === 0 && (
                    <div className="py-8 text-center text-gray-400 border border-dashed rounded-xl">Nenhuma movimentação</div>
                )}
            </div>
        </div>
    );
};

export default TabColetivo;
