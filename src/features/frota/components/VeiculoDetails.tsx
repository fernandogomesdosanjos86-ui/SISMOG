import React from 'react';
import { Car, Zap, Fuel, Calendar, Activity, BatteryCharging } from 'lucide-react';
import type { Veiculo } from '../types';
import StatusBadge from '../../../components/StatusBadge';
import { format } from 'date-fns';

interface VeiculoDetailsProps {
    veiculo: Veiculo;
}

const VeiculoDetails: React.FC<VeiculoDetailsProps> = ({ veiculo }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{veiculo.marca_modelo}</h3>
                    <p className="text-sm text-gray-500 mt-1 font-mono uppercase">{veiculo.placa}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        {veiculo.tipo === 'Elétrico' ? <Zap size={16} className="mr-2" /> : <Car size={16} className="mr-2" />}
                        Tipo
                    </div>
                    <div className="text-gray-900 font-semibold">{veiculo.tipo}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <Fuel size={16} className="mr-2" />
                        Abastecimento Habilitado?
                    </div>
                    <div className="text-gray-900 font-semibold">{veiculo.abastecimento ? 'Sim' : 'Não'}</div>
                </div>

                {veiculo.tipo === 'Elétrico' && veiculo.capacidade_bateria && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                        <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                            <BatteryCharging size={16} className="mr-2" />
                            Capacidade Bateria
                        </div>
                        <div className="text-gray-900 font-semibold">{veiculo.capacidade_bateria} kWh</div>
                    </div>
                )}

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <Activity size={16} className="mr-2" />
                        Status Atual
                    </div>
                    <div>
                        <StatusBadge active={veiculo.status === 'Ativo'} activeLabel="Ativo" inactiveLabel={veiculo.status} />
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <Calendar size={16} className="mr-2" />
                        Data de Cadastro
                    </div>
                    <div className="text-gray-900 font-semibold">{format(new Date(veiculo.created_at), 'dd/MM/yyyy')}</div>
                </div>
            </div>
        </div>
    );
};

export default VeiculoDetails;
