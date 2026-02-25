import React from 'react';
import { FileText, Activity, DollarSign } from 'lucide-react';
import type { Faturamento } from '../types';
import { formatCurrency } from '../../../utils/format';

interface FaturamentoDetailsProps {
    faturamento: Faturamento;
}

const FaturamentoDetails: React.FC<FaturamentoDetailsProps> = ({ faturamento }) => (
    <div className="space-y-6">
        <div className="flex items-start justify-between border-b border-gray-100 pb-5">
            <div>
                <h3 className="text-xl font-bold text-gray-900">{faturamento.contratos?.contratante}</h3>
                <p className="text-sm text-gray-500 mt-1 capitalize">Competência: {new Date(faturamento.competencia + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    <Activity size={16} className="mr-2" /> Status
                </div>
                <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase ${faturamento.status === 'emitido' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {faturamento.status}
                    </span>
                </div>
            </div>
            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex flex-col gap-2">
                <div className="flex items-center text-green-700 text-sm font-medium mb-1">
                    <DollarSign size={16} className="mr-2" /> Valor Líquido
                </div>
                <div className="text-green-900 font-semibold text-lg">{formatCurrency(faturamento.valor_liquido)}</div>
            </div>
        </div>

        {faturamento.status === 'emitido' && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                    <FileText size={16} className="text-gray-500" />
                    <span className="font-semibold text-gray-700">Nota Fiscal Emitida</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><span className="text-gray-500">Número:</span> {faturamento.numero_nf}</p>
                    <p><span className="text-gray-500">Emissão:</span> {faturamento.data_emissao ? new Date(faturamento.data_emissao).toLocaleDateString() : '-'}</p>
                </div>
            </div>
        )}

        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Detalhamento</h4>
            <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Valor Bruto:</span>
                    <span>{formatCurrency(faturamento.valor_bruto)}</span>
                </div>
                {(faturamento.acrescimo || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span>+ Acréscimos:</span>
                        <span>{formatCurrency(faturamento.acrescimo)}</span>
                    </div>
                )}
                {(faturamento.valor_retencao_pis || 0) > 0 && (
                    <div className="flex justify-between text-gray-600">
                        <span>- PIS:</span>
                        <span>{formatCurrency(faturamento.valor_retencao_pis)}</span>
                    </div>
                )}
                {(faturamento.valor_retencao_cofins || 0) > 0 && (
                    <div className="flex justify-between text-gray-600">
                        <span>- COFINS:</span>
                        <span>{formatCurrency(faturamento.valor_retencao_cofins)}</span>
                    </div>
                )}
                {(faturamento.valor_retencao_irpj || 0) > 0 && (
                    <div className="flex justify-between text-gray-600">
                        <span>- IRPJ:</span>
                        <span>{formatCurrency(faturamento.valor_retencao_irpj)}</span>
                    </div>
                )}
                {(faturamento.valor_retencao_csll || 0) > 0 && (
                    <div className="flex justify-between text-gray-600">
                        <span>- CSLL:</span>
                        <span>{formatCurrency(faturamento.valor_retencao_csll)}</span>
                    </div>
                )}
                {(faturamento.valor_retencao_inss || 0) > 0 && (
                    <div className="flex justify-between text-gray-600">
                        <span>- INSS:</span>
                        <span>{formatCurrency(faturamento.valor_retencao_inss)}</span>
                    </div>
                )}
                {(faturamento.valor_retencao_iss || 0) > 0 && (
                    <div className="flex justify-between text-gray-600">
                        <span>- ISS ({faturamento.perc_iss}%):</span>
                        <span>{formatCurrency(faturamento.valor_retencao_iss)}</span>
                    </div>
                )}
                {(faturamento.valor_retencao_caucao || 0) > 0 && (
                    <div className="flex justify-between text-orange-600">
                        <span>- Caução ({faturamento.perc_retencao_caucao}%):</span>
                        <span>{formatCurrency(faturamento.valor_retencao_caucao || 0)}</span>
                    </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-1 font-medium">
                    <span>Líquido:</span>
                    <span>{formatCurrency(faturamento.valor_liquido)}</span>
                </div>
            </div>
        </div>
    </div>
);

export default FaturamentoDetails;
