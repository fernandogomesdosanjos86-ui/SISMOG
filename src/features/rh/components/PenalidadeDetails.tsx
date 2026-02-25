import React from 'react';
import { Trash, Edit, FileText } from 'lucide-react';
import type { Penalidade } from '../types';
import { useModal } from '../../../context/ModalContext';
import { format } from 'date-fns';

interface PenalidadeDetailsProps {
    employeeName: string;
    penalidades: Penalidade[];
    onEdit: (item: Penalidade) => void;
    onDelete: (item: Penalidade) => void;
}

const PenalidadeDetails: React.FC<PenalidadeDetailsProps> = ({ employeeName, penalidades, onEdit, onDelete }) => {
    const { openConfirmModal } = useModal();

    const handleDelete = (item: Penalidade) => {
        openConfirmModal(
            'Excluir Penalidade',
            `Tem certeza que deseja excluir esta penalidade de ${item.penalidade}?`,
            () => onDelete(item)
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Histórico de Penalidades</h3>
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Arquivo</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {penalidades.map((item: Penalidade) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                    {format(new Date(item.data + 'T12:00:00'), 'dd/MM/yyyy')}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md w-fit whitespace-nowrap ${item.penalidade.includes('Suspensão') ? 'bg-red-100 text-red-800' :
                                        item.penalidade.includes('Escrita') ? 'bg-orange-100 text-orange-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {item.penalidade}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-700 max-w-sm truncate">
                                    {item.descricao || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-center">
                                    {item.arquivo_url ? (
                                        <a href={item.arquivo_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-900 p-1 inline-block" title="Ver Arquivo">
                                            <FileText size={16} className="mx-auto" />
                                        </a>
                                    ) : '-'}
                                </td>
                                <td className="px-4 py-3 text-right text-sm">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900 p-1" title="Editar">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-900 p-1" title="Excluir">
                                            <Trash size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {penalidades.length === 0 && (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nenhuma penalidade</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards View */}
            <div className="sm:hidden space-y-3">
                {penalidades.map((item: Penalidade) => (
                    <div key={item.id} className="bg-white border text-sm border-gray-200 p-4 rounded-xl shadow-sm relative">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`px-2 py-1 text-xs rounded-md font-bold ${item.penalidade.includes('Suspensão') ? 'bg-red-100 text-red-800' :
                                item.penalidade.includes('Escrita') ? 'bg-orange-100 text-orange-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                {item.penalidade}
                            </span>
                            <p className="text-xs text-gray-500 font-medium">{format(new Date(item.data + 'T12:00:00'), 'dd/MM/yyyy')}</p>
                        </div>

                        {item.descricao && (
                            <p className="text-gray-700 text-sm mt-3 mb-3 bg-gray-50 p-2 rounded-lg border border-gray-100">{item.descricao}</p>
                        )}

                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                            {item.arquivo_url ? (
                                <a href={item.arquivo_url} target="_blank" rel="noreferrer" className="flex items-center text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-3 py-1.5 rounded-lg" title="Ver Arquivo">
                                    <FileText size={14} className="mr-1.5" />
                                    Anexo
                                </a>
                            ) : <div></div>}
                            <div className="flex gap-2">
                                <button onClick={() => onEdit(item)} className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg" title="Editar">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg" title="Excluir">
                                    <Trash size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {penalidades.length === 0 && (
                    <div className="py-8 text-center text-gray-400 border border-dashed rounded-xl">Nenhuma penalidade</div>
                )}
            </div>
        </div>
    );
};

export default PenalidadeDetails;
