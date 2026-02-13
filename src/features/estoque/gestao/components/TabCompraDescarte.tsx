import React, { useState } from 'react';
import { Search, Trash } from 'lucide-react';
import ResponsiveTable from '../../../../components/ResponsiveTable';
import { useModal } from '../../../../context/ModalContext';
import type { Movimentacao } from '../types';

interface TabCompraDescarteProps {
    movimentacoes: Movimentacao[];
    isLoading: boolean;
    deleteMov: (id: string) => Promise<any>;
    onRefresh: () => void;
}

const ITEMS_PER_PAGE = 50;

const TabCompraDescarte: React.FC<TabCompraDescarteProps> = ({ movimentacoes, isLoading, deleteMov, onRefresh }) => {
    const { openConfirmModal } = useModal();
    const [searchTerm, setSearchTerm] = useState('');
    const [tipoFilter, setTipoFilter] = useState<'TODOS' | 'Compra' | 'Descarte'>('TODOS');

    const compraDescarte = movimentacoes.filter(m => m.tipo === 'Compra' || m.tipo === 'Descarte');

    const filtered = compraDescarte.filter(m => {
        const matchesTipo = tipoFilter === 'TODOS' || m.tipo === tipoFilter;
        const matchesSearch = (m.produto?.codigo || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTipo && matchesSearch;
    });

    const handleDelete = (id: string) => {
        openConfirmModal(
            'Excluir Movimentação',
            'Tem certeza que deseja excluir esta movimentação?',
            async () => {
                await deleteMov(id);
                onRefresh();
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
                <span className={`px-2 py-1 text-xs rounded-full font-bold ${m.tipo === 'Compra' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
        <div>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="font-bold text-gray-900 text-sm">{m.produto?.codigo}</p>
                    <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${m.tipo === 'Compra' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
            <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por código..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={tipoFilter}
                    onChange={e => setTipoFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-200 rounded-lg bg-white"
                >
                    <option value="TODOS">Todos</option>
                    <option value="Compra">Compra</option>
                    <option value="Descarte">Descarte</option>
                </select>
            </div>

            <ResponsiveTable
                data={filtered.slice(0, ITEMS_PER_PAGE)}
                columns={columns}
                keyExtractor={m => m.id}
                loading={isLoading}
                skeletonRows={5}
                renderCard={renderCard}
            />

            {filtered.length > ITEMS_PER_PAGE && (
                <p className="text-center text-sm text-gray-500">
                    Mostrando {ITEMS_PER_PAGE} de {filtered.length} registros
                </p>
            )}
        </div>
    );
};

export default TabCompraDescarte;
