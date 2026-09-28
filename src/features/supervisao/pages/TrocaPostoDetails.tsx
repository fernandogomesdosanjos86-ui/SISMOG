import React from 'react';
import { Building2, Calendar, User, FileText, ArrowRight, Trash2, Edit } from 'lucide-react';
import CompanyBadge from '../../../components/CompanyBadge';
import { formatDate } from '../../../utils/format';
import type { TrocaPosto } from '../types';

interface TrocaPostoDetailsProps {
    troca: TrocaPosto;
    onEdit?: () => void;
    onDelete?: () => void;
}

const TrocaPostoDetails: React.FC<TrocaPostoDetailsProps> = ({ troca, onEdit, onDelete }) => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <User size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">
                            {troca.funcionario?.nome || 'Funcionário'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Deslocamento Operacional de Posto
                        </p>
                    </div>
                </div>
                <CompanyBadge company={troca.empresa} />
            </div>

            {/* Grid dos Postos: De -> Para */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Posto Original */}
                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100 flex flex-col gap-2">
                    <div className="flex items-center text-amber-800 text-xs font-semibold uppercase tracking-wider">
                        <Building2 size={16} className="mr-1.5 text-amber-600" /> Posto Original
                    </div>
                    <div className="text-gray-900 font-bold text-base mt-1">
                        {troca.posto_original?.nome || 'Não informado'}
                    </div>
                    <div className="text-xs text-amber-700">
                        Empresa do Posto: <span className="font-semibold">{troca.posto_original?.empresa || troca.empresa}</span>
                    </div>
                </div>

                {/* Posto de Cobertura */}
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 flex flex-col gap-2">
                    <div className="flex items-center text-emerald-800 text-xs font-semibold uppercase tracking-wider">
                        <ArrowRight size={16} className="mr-1.5 text-emerald-600" /> Posto para Cobertura
                    </div>
                    <div className="text-gray-900 font-bold text-base mt-1">
                        {troca.posto_cobertura?.nome || 'Não informado'}
                    </div>
                    <div className="text-xs text-emerald-700">
                        Empresa do Posto: <span className="font-semibold">{troca.posto_cobertura?.empresa || 'Não informado'}</span>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Calendar size={18} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Data do Deslocamento</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(troca.data)}</p>
                    </div>
                </div>

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <User size={18} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium">Registrado por</p>
                        <p className="text-sm font-semibold text-gray-900">{troca.solicitante?.nome || 'Sistema'}</p>
                    </div>
                </div>
            </div>

            {/* Observações */}
            {troca.observacoes && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1">
                    <div className="flex items-center text-xs font-semibold text-gray-700">
                        <FileText size={14} className="mr-1.5 text-gray-500" /> Observações
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap pl-5">
                        {troca.observacoes}
                    </p>
                </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-gray-400 text-center pt-2">
                Criado em {new Date(troca.created_at).toLocaleString('pt-BR')}
            </div>

            {/* Ações */}
            {(onEdit || onDelete) && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    {onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                            <Trash2 size={16} /> Excluir
                        </button>
                    )}
                    {onEdit && (
                        <button
                            type="button"
                            onClick={onEdit}
                            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                            <Edit size={16} /> Editar
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default TrocaPostoDetails;
