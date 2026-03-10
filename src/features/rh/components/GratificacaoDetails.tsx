import React from 'react';
import { Trash, Edit } from 'lucide-react';
import type { Gratificacao } from '../types';
import { format } from 'date-fns';

interface GratificacaoDetailsProps {
    employeeName: string;
    gratificacoes: Gratificacao[];
    onEdit: (item: Gratificacao) => void;
    onDelete: (item: Gratificacao) => void;
}

const formatValue = (item: Gratificacao) => {
    if (item.tipo === 'Folha de Pagamento') {
        return <span className="text-blue-600 font-bold">{item.gratificacao_percentual}%</span>;
    }
    if (item.tipo === 'Incentivo' && item.incentivo_valor) {
        return <span className="text-emerald-600 font-bold">R$ {item.incentivo_valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>;
    }
    return '-';
};

const GratificacaoDetails: React.FC<GratificacaoDetailsProps> = ({ employeeName, gratificacoes, onEdit, onDelete }) => {

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Histórico de Gratificações</h3>
                    <p className="text-sm text-gray-500 mt-1">Funcionário: {employeeName}</p>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor/Percentual</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {gratificacoes.map((item: Gratificacao) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                    {format(new Date(item.data + 'T12:00:00'), 'dd/MM/yyyy')}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${item.tipo === 'Folha de Pagamento' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                                        }`}>
                                        {item.tipo}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-center sm:text-left">
                                    {formatValue(item)}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 max-w-sm truncate">
                                    {item.observacao || '-'}
                                </td>
                                <td className="px-4 py-3 text-right text-sm">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900 p-1" title="Editar">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => onDelete(item)} className="text-red-600 hover:text-red-900 p-1" title="Excluir">
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {gratificacoes.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nenhum registro encontrado.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards View */}
            <div className="sm:hidden space-y-3">
                {gratificacoes.map((item: Gratificacao) => (
                    <div key={item.id} className="bg-white border text-sm border-gray-200 p-4 rounded-xl shadow-sm relative">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${item.tipo === 'Folha de Pagamento' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                {item.tipo}
                            </span>
                            <p className="text-xs text-gray-500 font-medium">{format(new Date(item.data + 'T12:00:00'), 'dd/MM/yyyy')}</p>
                        </div>

                        <div className="mt-2 mb-2">
                            <span className="text-sm text-gray-600 mr-2">Valor:</span>
                            {formatValue(item)}
                        </div>

                        {item.observacao && (
                            <p className="text-gray-700 text-sm mt-3 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">{item.observacao}</p>
                        )}

                        <div className="flex justify-end items-center mt-3 pt-3 border-t border-gray-100">
                            <div className="flex gap-2">
                                <button onClick={() => onEdit(item)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg" title="Editar">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => onDelete(item)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg" title="Excluir">
                                    <Trash size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {gratificacoes.length === 0 && (
                    <div className="py-8 text-center text-gray-400 border border-dashed rounded-xl">Nenhum registro encontrado.</div>
                )}
            </div>
        </div>
    );
};

export default GratificacaoDetails;
