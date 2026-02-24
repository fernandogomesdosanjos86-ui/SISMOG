import React from 'react';
import { Calendar, User, Gauge, Droplet, DollarSign, Car } from 'lucide-react';
import type { Abastecimento } from '../types';
import { format } from 'date-fns';

interface AbastecimentoDetailsProps {
    abastecimento: Abastecimento;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const AbastecimentoDetails: React.FC<AbastecimentoDetailsProps> = ({ abastecimento }) => {
    // Add local timezone offset to display the exact selected date
    const dateObj = new Date(abastecimento.data);
    const correctedDate = new Date(dateObj.getTime() + dateObj.getTimezoneOffset() * 60000);

    return (
        <div className="space-y-6">
            {/* Header / Main Info */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">
                        {formatCurrency(abastecimento.valor)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <Calendar size={14} />
                        {format(correctedDate, 'dd/MM/yyyy')}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 flex items-center justify-end gap-1.5">
                        <User size={14} className="text-blue-500" />
                        {abastecimento.responsavel}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Responsável</p>
                </div>
            </div>

            {/* Grid Infos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <Car size={16} className="mr-2" />
                        Veículo
                    </div>
                    <div className="text-gray-900 font-semibold">
                        {abastecimento.frota_veiculos?.marca_modelo || '-'}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                        {abastecimento.frota_veiculos?.placa || '-'}
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <Gauge size={16} className="mr-2 flex-shrink-0" />
                        Quilometragem (Km)
                    </div>
                    <div className="text-gray-900 font-mono font-semibold">
                        {abastecimento.km_atual.toLocaleString('pt-BR')}
                    </div>
                </div>

                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col gap-2">
                    <div className="flex items-center text-blue-700 text-sm font-medium mb-1">
                        <Droplet size={16} className="mr-2" />
                        Volume
                    </div>
                    <div className="text-blue-900 font-semibold text-lg">
                        {abastecimento.litros} <span className="text-sm font-normal">Litros</span>
                    </div>
                </div>

                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex flex-col gap-2">
                    <div className="flex items-center text-green-700 text-sm font-medium mb-1">
                        <DollarSign size={16} className="mr-2" />
                        Custo Médio
                    </div>
                    <div className="text-green-900 font-semibold text-lg">
                        {formatCurrency(abastecimento.valor / abastecimento.litros)} <span className="text-sm font-normal">/ Litro</span>
                    </div>
                </div>
            </div>

            <div className="text-xs text-gray-400 pt-4 text-center">
                Registrado em {format(new Date(abastecimento.created_at), 'dd/MM/yyyy HH:mm')}
            </div>
        </div>
    );
};

export default AbastecimentoDetails;
