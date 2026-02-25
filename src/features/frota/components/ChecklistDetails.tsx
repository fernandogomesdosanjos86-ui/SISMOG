import React from 'react';
import type { Checklist } from '../types';
import { format } from 'date-fns';
import { ShieldCheck, Target, AlertTriangle, Car, Tag } from 'lucide-react';
import { CHECKLIST_ITEMS } from '../types';

interface ChecklistDetailsProps {
    checklist: Checklist;
}

const ChecklistDetails: React.FC<ChecklistDetailsProps> = ({ checklist }) => {

    // Format datetimes safely
    const dataObj = new Date(checklist.data);
    const dataLocal = new Date(dataObj.getTime() + dataObj.getTimezoneOffset() * 60000);

    return (
        <div className="space-y-6">
            {/* Header info */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white shadow-sm border border-gray-100 rounded-lg text-blue-600">
                        <Car size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{checklist.frota_veiculos?.marca_modelo}</h3>
                        <p className="text-sm font-mono text-gray-500 bg-gray-200 px-2 py-0.5 rounded inline-block mt-1">
                            {checklist.frota_veiculos?.placa}
                        </p>
                    </div>
                </div>
                <div className="text-left md:text-right">
                    <p className="text-sm text-gray-500 uppercase tracking-wide font-medium">Data</p>
                    <p className="font-bold text-gray-900">{format(dataLocal, 'dd/MM/yyyy')}</p>
                </div>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border text-sm rounded-lg p-3 shadow-sm border-gray-200 flex flex-col items-center justify-center py-4">
                    <p className="text-gray-500 mb-1 flex items-center gap-1"><Target size={14} /> KM no Hodômetro</p>
                    <p className="font-mono text-lg text-gray-900">{checklist.km_atual.toLocaleString('pt-BR')} km</p>
                </div>
                <div className="bg-white border text-sm rounded-lg p-3 shadow-sm border-gray-200 flex flex-col items-center justify-center py-4">
                    <p className="text-gray-500 mb-1 flex items-center gap-1"><Tag size={14} /> Elaborado por</p>
                    <p className="font-medium text-gray-900 text-center">{checklist.responsavel}</p>
                </div>
            </div>

            {/* Checklist items output */}
            <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm border-b pb-1">
                    <ShieldCheck size={16} className="text-blue-500" />
                    Inspeção de Itens
                </h4>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {CHECKLIST_ITEMS.map(item => {
                        const contains = checklist.checkitens?.includes(item);
                        return (
                            <div key={item} className={`p-2 border rounded text-xs flex items-center gap-2 ${contains ? 'bg-green-50 border-green-200 text-green-900' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${contains ? 'bg-green-500' : 'bg-gray-300'}`} />
                                <span className={contains ? 'font-medium' : 'line-through'}>{item}</span>
                            </div>
                        )
                    })}
                </div>

                {checklist.outros_itens && (
                    <div className="mt-3 bg-gray-50 p-3 rounded border text-sm text-gray-700">
                        <span className="font-semibold block mb-1">Outros Itens/Observações:</span>
                        <p>{checklist.outros_itens}</p>
                    </div>
                )}
            </div>

            {/* Avaria Output */}
            {checklist.avaria_manutencao && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-900 flex items-center gap-2 text-sm mb-2">
                        <AlertTriangle size={16} />
                        Avaria ou Manutenção Identificada
                    </h4>
                    <p className="text-sm text-orange-800 bg-white p-3 rounded border border-orange-100 italic">
                        "{checklist.descricao_avaria}"
                    </p>
                </div>
            )}

            <div className="text-xs text-gray-400 text-center pt-2">
                Registrado em: {format(new Date(checklist.created_at), 'dd/MM/yyyy HH:mm')}
            </div>
        </div>
    );
};

export default ChecklistDetails;
