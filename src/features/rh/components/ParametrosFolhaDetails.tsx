import React from 'react';
import type { ParametrosFolha } from '../types';
import { DollarSign, Info } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { format } from 'date-fns';

interface ParametrosFolhaDetailsProps {
    parametros: ParametrosFolha;
}

const ParametrosFolhaDetails: React.FC<ParametrosFolhaDetailsProps> = ({ parametros }) => {
    return (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Parâmetros Folha - Ano {parametros.ano}</h3>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Configurações globais de tributação e proventos.</p>
                </div>
            </div>

            {/* Informações Gerais */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <DollarSign size={16} className="mr-2 text-blue-500" /> Salário Mínimo
                    </div>
                    <div className="text-gray-900 font-bold text-lg">{formatCurrency(parametros.valor_salario_minimo)}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <DollarSign size={16} className="mr-2 text-blue-500" /> Teto Salário Família
                    </div>
                    <div className="text-gray-900 font-bold text-lg">{formatCurrency(parametros.teto_salario_familia)}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <DollarSign size={16} className="mr-2 text-blue-500" /> Valor Salário Família
                    </div>
                    <div className="text-gray-900 font-bold text-lg">{formatCurrency(parametros.valor_salario_familia)}</div>
                </div>
            </div>

            {/* Faixas INSS Title */}
            <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider flex items-center">
                    <Info size={16} className="mr-2 text-blue-500" /> Faixas de Desconto INSS
                </h4>
            </div>

            {/* Faixa 1 and 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/70 flex flex-col gap-3">
                    <span className="text-sm font-semibold text-blue-800">Faixa 1</span>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                            <span className="text-gray-500 block">Teto INSS</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(parametros.teto_inss_1)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Alíquota</span>
                            <span className="font-semibold text-gray-900">{parametros.aliquota_inss_1}%</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Desconto Máx.</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(parametros.desconto_inss_1)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/70 flex flex-col gap-3">
                    <span className="text-sm font-semibold text-blue-800">Faixa 2</span>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                            <span className="text-gray-500 block">Teto INSS</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(parametros.teto_inss_2)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Alíquota</span>
                            <span className="font-semibold text-gray-900">{parametros.aliquota_inss_2}%</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Desconto Máx.</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(parametros.desconto_inss_2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Faixa 3 and 4 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/70 flex flex-col gap-3">
                    <span className="text-sm font-semibold text-blue-800">Faixa 3</span>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                            <span className="text-gray-500 block">Teto INSS</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(parametros.teto_inss_3)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Alíquota</span>
                            <span className="font-semibold text-gray-900">{parametros.aliquota_inss_3}%</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Desconto Máx.</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(parametros.desconto_inss_3)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/70 flex flex-col gap-3">
                    <span className="text-sm font-semibold text-blue-800">Faixa 4</span>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                            <span className="text-gray-500 block">Teto INSS</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(parametros.teto_inss_4)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Alíquota</span>
                            <span className="font-semibold text-gray-900">{parametros.aliquota_inss_4}%</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Desconto Máx.</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(parametros.desconto_inss_4)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timestamp */}
            {parametros.created_at && (
                <div className="text-xs text-gray-400 pt-4 text-center border-t border-gray-100">
                    Configurado em {format(new Date(parametros.created_at), 'dd/MM/yyyy HH:mm')}
                </div>
            )}
        </div>
    );
};

export default ParametrosFolhaDetails;
