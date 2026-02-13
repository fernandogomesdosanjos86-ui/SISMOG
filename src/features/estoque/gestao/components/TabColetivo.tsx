import React, { useState } from 'react';
import { Search, Trash } from 'lucide-react';
import ResponsiveTable from '../../../../components/ResponsiveTable';
import { useModal } from '../../../../context/ModalContext';
import { estoqueGestaoService } from '../../../../services/estoqueGestaoService';
import type { Movimentacao, ResumoPosto } from '../types';

interface TabColetivoProps {
    onRefresh: () => void;
    deleteMov: (id: string) => Promise<any>;
}

const ITEMS_PER_PAGE = 50;

const TabColetivo: React.FC<TabColetivoProps> = ({ onRefresh, deleteMov }) => {
    const { openViewModal, showFeedback } = useModal();
    const [searchTerm, setSearchTerm] = useState('');
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
            <div className="bg-white p-4 rounded-xl shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome do posto..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

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

            <div className="overflow-x-auto">
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
                        {movimentacoes.map(m => (
                            <tr key={m.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-medium">{m.produto?.codigo}</td>
                                <td className="px-4 py-3 text-sm">
                                    <span className={`px-2 py-1 text-xs rounded-full font-bold ${m.tipo === 'Entrega' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}>{m.tipo}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-center font-bold">{m.quantidade}</td>
                                <td className="px-4 py-3 text-sm">{new Date(m.data).toLocaleDateString('pt-BR')}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{m.observacao || '-'}</td>
                                <td className="px-4 py-3 text-sm text-right">
                                    <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:text-red-900 p-1" title="Excluir">
                                        <Trash size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {movimentacoes.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nenhuma movimentação</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TabColetivo;
