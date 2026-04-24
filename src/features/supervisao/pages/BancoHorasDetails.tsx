import React from 'react';
import { Edit, Trash, Calendar, FileText, ActivitySquare } from 'lucide-react';
import type { BancoHoras } from '../types';
import { useModal } from '../../../context/ModalContext';
import { formatMinutesToHHmm } from '../BancoHoras';

interface BancoHorasDetailsProps {
    employeeName: string;
    saldoMinutos: number;
    bancoHoras: BancoHoras[];
    onEdit: (item: BancoHoras) => void;
    onDelete: (id: string) => Promise<void>;
}

const BancoHorasDetails: React.FC<BancoHorasDetailsProps> = ({ employeeName, saldoMinutos, bancoHoras, onEdit, onDelete }) => {
    const { openConfirmModal, closeModal, showFeedback } = useModal();

    const handleDeleteClick = (id: string) => {
        openConfirmModal(
            'Excluir Registro',
            'Tem certeza que deseja excluir este registro de Banco de Horas?',
            async () => {
                try {
                    await onDelete(id);
                    showFeedback('success', 'Registro excluído com sucesso.');
                    closeModal();
                } catch (error) {
                    showFeedback('error', 'Erro ao excluir o registro.');
                }
            }
        );
    };

    const getTypeColor = (tipo: string) => {
        if (tipo === 'Positiva') return 'text-green-600 bg-green-50 border-green-100';
        if (tipo === 'Negativa') return 'text-red-600 bg-red-50 border-red-100';
        return 'text-blue-600 bg-blue-50 border-blue-100'; // Compensação
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{employeeName}</h3>
                    <p className="text-sm text-gray-500 mt-1">Detalhes do Banco de Horas</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Saldo Atual</p>
                    <p className={`text-2xl font-bold ${saldoMinutos > 0 ? 'text-green-600' : saldoMinutos < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                        {saldoMinutos > 0 ? '+' : ''}{formatMinutesToHHmm(saldoMinutos)}
                    </p>
                </div>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {bancoHoras.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-gray-400" />
                                <span className="font-semibold text-gray-800">
                                    {new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onEdit(item)}
                                    className="text-blue-600 hover:text-blue-900 p-1 transition-colors"
                                    title="Editar"
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(item.id)}
                                    className="text-red-600 hover:text-red-900 p-1 transition-colors"
                                    title="Excluir"
                                >
                                    <Trash size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className={`p-3 rounded-lg border ${getTypeColor(item.tipo)}`}>
                                <div className="flex items-center gap-2 mb-1">
                                    <ActivitySquare size={14} />
                                    <span className="text-xs uppercase font-bold">{item.tipo}</span>
                                </div>
                                <p className="text-lg font-semibold">{formatMinutesToHHmm(item.duracao_minutos)}</p>
                            </div>

                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText size={14} className="text-gray-500" />
                                    <span className="text-xs uppercase font-bold text-gray-500">Descrição</span>
                                </div>
                                <p className="text-sm text-gray-700 break-words">{item.descricao}</p>
                            </div>
                        </div>
                    </div>
                ))}

                {bancoHoras.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        Nenhum registro encontrado para este funcionário.
                    </div>
                )}
            </div>
        </div>
    );
};

export default BancoHorasDetails;
