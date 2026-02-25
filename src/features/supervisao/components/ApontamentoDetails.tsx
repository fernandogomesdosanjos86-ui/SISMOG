import React from 'react';
import { Trash, Edit } from 'lucide-react';
import type { Apontamento } from '../types';
import { useModal } from '../../../context/ModalContext';

interface ApontamentoDetailsProps {
    employeeName: string;
    apontamentos: Apontamento[];
    onEdit: (item: Apontamento) => void;
    onDelete: (id: string) => void;
}

const formatScore = (score: number) => {
    if (score > 0) return <span className="text-green-600 font-bold">+{score}</span>;
    if (score < 0) return <span className="text-red-600 font-bold">{score}</span>;
    return <span className="text-gray-500 font-medium">{score}</span>;
};

const ApontamentoDetails: React.FC<ApontamentoDetailsProps> = ({ employeeName, apontamentos, onEdit, onDelete }) => {
    const { openConfirmModal } = useModal();

    const totalFrequencia = apontamentos.reduce((acc: number, curr: Apontamento) => acc + curr.frequencia_pts, 0);
    const totalBeneficios = apontamentos.reduce((acc: number, curr: Apontamento) => acc + curr.beneficios_pts, 0);

    const handleDelete = (id: string) => {
        openConfirmModal(
            'Excluir Apontamento',
            'Tem certeza que deseja excluir este apontamento?',
            () => onDelete(id)
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Histórico de Apontamentos</h3>
                    <p className="text-sm text-gray-500 mt-1">Funcionário: {employeeName}</p>
                </div>
            </div>

            {/* Header Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">Frequência</div>
                    <div className="text-2xl">{formatScore(totalFrequencia)}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">Benefícios</div>
                    <div className="text-2xl">{formatScore(totalBeneficios)}</div>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apontamento</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posto / Empresa</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Frequência</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Benefícios</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {apontamentos.map((item: Apontamento) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                    {new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {item.apontamento}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700">
                                    {item.posto?.nome} <br />
                                    <span className="text-xs text-gray-500">{item.empresa}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-center">
                                    {formatScore(item.frequencia_pts)}
                                </td>
                                <td className="px-4 py-3 text-sm text-center">
                                    {formatScore(item.beneficios_pts)}
                                </td>
                                <td className="px-4 py-3 text-right text-sm">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900 p-1" title="Editar">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900 p-1" title="Excluir">
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {apontamentos.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nenhum apontamento</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards View */}
            <div className="sm:hidden space-y-3">
                {apontamentos.map((item: Apontamento) => (
                    <div key={item.id} className="bg-white border text-sm border-gray-200 p-3 rounded-xl shadow-sm relative">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-bold text-gray-900">{item.apontamento}</p>
                                <p className="text-xs text-gray-400">{new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full font-bold ${item.empresa === 'FEMOG' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                {item.empresa}
                            </span>
                        </div>

                        <p className="text-gray-600 text-xs mb-3">{item.posto?.nome}</p>

                        <div className="flex justify-between items-center mt-2 border-t pt-2 border-gray-100">
                            <div className="flex gap-4">
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-500 uppercase">Freq.</p>
                                    <p className="text-sm">{formatScore(item.frequencia_pts)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-500 uppercase">Ben.</p>
                                    <p className="text-sm">{formatScore(item.beneficios_pts)}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onEdit(item)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg" title="Editar">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg" title="Excluir">
                                    <Trash size={16} />
                                </button>
                            </div>
                        </div>
                        {item.observacao && (
                            <p className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded-md">{item.observacao}</p>
                        )}
                    </div>
                ))}
                {apontamentos.length === 0 && (
                    <div className="py-8 text-center text-gray-400 border border-dashed rounded-xl">Nenhum apontamento</div>
                )}
            </div>
        </div>
    );
};

export default ApontamentoDetails;
