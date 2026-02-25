import React from 'react';
import ResponsiveTable from '../../../../components/ResponsiveTable';
import type { Produto } from '../types';

interface TabEstoqueProps {
    produtos: (Produto & { em_estoque: number })[];
    isLoading: boolean;
    searchTerm: string;
    tipoFilter: 'TODOS' | 'Individual' | 'Coletivo';
}

const ITEMS_PER_PAGE = 50;

const TabEstoque: React.FC<TabEstoqueProps> = ({ produtos, isLoading, searchTerm, tipoFilter }) => {

    const filtered = produtos.filter(p => {
        const matchesTipo = tipoFilter === 'TODOS' || p.tipo === tipoFilter;
        const matchesSearch = p.codigo.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTipo && matchesSearch;
    });

    const columns = [
        {
            key: 'codigo', header: 'Código', render: (p: Produto & { em_estoque: number }) => (
                <span className="font-medium text-gray-900">{p.codigo}</span>
            )
        },
        {
            key: 'tipo', header: 'Tipo', render: (p: Produto & { em_estoque: number }) => (
                <span className={`px-2 py-1 text-xs rounded-full font-bold ${p.tipo === 'Individual' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
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
        <div className="flex justify-between items-center">
            <div>
                <p className="font-bold text-gray-900 text-sm">{p.codigo}</p>
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${p.tipo === 'Individual' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
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
                data={filtered.slice(0, ITEMS_PER_PAGE)}
                columns={columns}
                keyExtractor={p => p.id}
                loading={isLoading}
                skeletonRows={5}
                renderCard={renderCard}
            />

            {filtered.length > ITEMS_PER_PAGE && (
                <p className="text-center text-sm text-gray-500">
                    Mostrando {ITEMS_PER_PAGE} de {filtered.length} produtos
                </p>
            )}
        </div>
    );
};

export default TabEstoque;
