import React from 'react';
import type { Movimentacao } from '../types';
import { format, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, MapPin, Gauge, Battery, Zap } from 'lucide-react';

interface MovimentacaoDetailsProps {
    movimentacao: Movimentacao;
}

const MovimentacaoDetails: React.FC<MovimentacaoDetailsProps> = ({ movimentacao }) => {
    // A API pode retornar como "veiculo" ou "frota_veiculos" baseado na versão da query
    const veiculoData = movimentacao.frota_veiculos || (movimentacao as any).veiculo;
    const isEletrico = veiculoData?.tipo === 'Elétrico';

    // Calculo de duração
    const initialDate = new Date(movimentacao.data_hora_inicial);
    const finalDate = new Date(movimentacao.data_hora_final);
    const minDiff = differenceInMinutes(finalDate, initialDate);
    const hours = Math.floor(minDiff / 60);
    const minutes = minDiff % 60;
    const duracaoFormatada = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    return (
        <div className="space-y-6">
            {/* Cabecalho Veiculo */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-start gap-4">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{veiculoData?.marca_modelo || 'Veículo Desconhecido'}</h3>
                    <div className="flex items-center gap-3 text-sm mt-1">
                        <span className="font-mono bg-gray-200 text-gray-700 px-2 py-0.5 rounded uppercase tracking-wider">
                            {veiculoData?.placa}
                        </span>
                        <span className="text-gray-500">
                            {veiculoData?.tipo}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Responsável</p>
                    <p className="text-sm font-medium text-gray-900">{movimentacao.responsavel}</p>
                </div>
            </div>

            {/* Timings e Trajeto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-100 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-indigo-600 mb-3">
                        <Clock size={18} />
                        <h4 className="font-semibold text-gray-900">Período e Duração</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Saída:</span>
                            <span className="font-medium text-gray-900">{format(initialDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Retorno:</span>
                            <span className="font-medium text-gray-900">{format(finalDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-100 mt-2">
                            <span className="text-gray-500">Tempo de Uso:</span>
                            <span className="font-bold text-indigo-600">{duracaoFormatada}</span>
                        </div>
                    </div>
                </div>

                <div className="border border-gray-100 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-orange-500 mb-3">
                        <MapPin size={18} />
                        <h4 className="font-semibold text-gray-900">Itinerário</h4>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed bg-orange-50 p-3 rounded-lg border border-orange-100">
                        {movimentacao.trajeto}
                    </p>
                </div>
            </div>

            {/* Odômetros */}
            <div className="bg-white border border-gray-100 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-blue-500 mb-4">
                    <Gauge size={18} />
                    <h4 className="font-semibold text-gray-900">Odômetro</h4>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">T. Inicial</p>
                        <p className="font-mono text-gray-900">{movimentacao.km_inicial} km</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border-b-2 border-blue-500">
                        <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Rodados</p>
                        <p className="font-medium text-blue-600">+{movimentacao.km_rodados} km</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">T. Final</p>
                        <p className="font-mono text-gray-900">{movimentacao.km_final} km</p>
                    </div>
                </div>
            </div>

            {/* Dados de Bateria */}
            {isEletrico && (
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 text-green-600">
                            <Battery size={18} />
                            <h4 className="font-semibold text-green-900">Controle Energético</h4>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-white p-3 rounded-lg border border-green-100">
                            <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Bat. Inicial</p>
                            <p className="font-medium text-gray-900">{movimentacao.bateria_inicial}%</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border-b-2 border-green-500 flex flex-col justify-center items-center">
                            <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Consumido</p>
                            <div className="flex items-center gap-1">
                                <span className="font-bold text-green-600">-{movimentacao.consumo_bateria}%</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-emerald-600 mt-1">
                                <Zap size={12} />
                                <span>{movimentacao.consumo_kw?.toFixed(2) || 0} kWh calculados</span>
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-green-100">
                            <p className="text-xs text-gray-500 mb-1 uppercase font-semibold">Bat. Final</p>
                            <p className="font-medium text-gray-900">{movimentacao.bateria_final}%</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MovimentacaoDetails;
