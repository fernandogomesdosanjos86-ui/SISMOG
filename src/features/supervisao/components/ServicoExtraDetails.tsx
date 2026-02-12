import React from 'react';
import { Trash, Edit } from 'lucide-react';
import type { ServicoExtra } from '../types';
import { useModal } from '../../../context/ModalContext';

interface ServicoExtraDetailsProps {
    employeeName: string;
    services: ServicoExtra[];
    onEdit: (service: ServicoExtra) => void;
    onDelete: (id: string) => void;
}

const ServicoExtraDetails: React.FC<ServicoExtraDetailsProps> = ({ services, onEdit, onDelete }) => {
    const { openConfirmModal } = useModal();

    const totalValue = services.reduce((acc, curr) => acc + curr.valor, 0);
    const totalFemog = services.filter(s => s.empresa === 'FEMOG').reduce((acc, curr) => acc + curr.valor, 0);
    const totalSemog = services.filter(s => s.empresa === 'SEMOG').reduce((acc, curr) => acc + curr.valor, 0);

    const handleDelete = (id: string) => {
        openConfirmModal(
            'Excluir Serviço',
            'Tem certeza que deseja excluir este lançamento?',
            () => onDelete(id)
        );
    };

    const [expandedId, setExpandedId] = React.useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center md:text-left">
                    <p className="text-xs text-gray-500 uppercase">Total</p>
                    <p className="text-xl font-bold text-gray-900">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-center md:text-left">
                    <p className="text-xs text-gray-500 uppercase text-blue-600">Total FEMOG</p>
                    <p className="text-lg font-semibold text-blue-700">R$ {totalFemog.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-center md:text-left">
                    <p className="text-xs text-gray-500 uppercase text-orange-600">Total SEMOG</p>
                    <p className="text-lg font-semibold text-orange-700">R$ {totalSemog.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden border rounded-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posto</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Duração</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {services.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(item.entrada).toLocaleDateString('pt-BR')} <br />
                                        <span className="text-xs text-gray-500">
                                            {new Date(item.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(item.saida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {item.posto?.nome} <br />
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${item.empresa === 'FEMOG' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                            {item.empresa}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                        {item.cargo?.cargo} <br />
                                        <span className="text-xs text-gray-500">{item.turno}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-medium">
                                        {item.duracao}h
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                        R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => onEdit(item)}
                                                className="text-blue-600 hover:text-blue-900 p-1"
                                                title="Editar"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-600 hover:text-red-900 p-1"
                                                title="Excluir"
                                            >
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {services.map((item) => (
                    <div
                        key={item.id}
                        className={`bg-white border rounded-lg p-4 shadow-sm transition-all ${expandedId === item.id ? 'ring-2 ring-blue-100' : ''}`}
                        onClick={() => toggleExpand(item.id)}
                    >
                        {/* Header Row */}
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold mb-1 inline-block ${item.empresa === 'FEMOG' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                    {item.empresa}
                                </span>
                                <p className="text-sm font-bold text-gray-900">{new Date(item.entrada).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-blue-600">
                                    R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        </div>

                        {/* Summary Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                            <div>
                                <span className="block text-gray-400">Posto</span>
                                {item.posto?.nome}
                            </div>
                            <div>
                                <span className="block text-gray-400">Horário</span>
                                {new Date(item.entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} -
                                {new Date(item.saida).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedId === item.id && (
                            <div className="mt-3 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-1">
                                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                                    <div>
                                        <span className="block text-gray-400">Cargo</span>
                                        {item.cargo?.cargo}
                                    </div>
                                    <div>
                                        <span className="block text-gray-400">Duração</span>
                                        {item.duracao}h
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEdit(item);
                                        }}
                                        className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 text-sm font-medium"
                                    >
                                        <Edit size={16} />
                                        Editar
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(item.id);
                                        }}
                                        className="flex items-center gap-1 bg-red-50 text-red-700 px-3 py-2 rounded-md hover:bg-red-100 text-sm font-medium"
                                    >
                                        <Trash size={16} />
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        )}

                        {expandedId !== item.id && (
                            <p className="text-center text-xs text-gray-400 mt-2">Toque para ver detalhes</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServicoExtraDetails;
