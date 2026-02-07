import React from 'react';
import type { Contrato } from '../types';
import { formatCurrency } from '../../../utils/format';
import CompanyBadge from '../../../components/CompanyBadge';
import StatusBadge from '../../../components/StatusBadge';

interface ContratoDetailsProps {
    contrato: Contrato;
}

const ContratoDetails: React.FC<ContratoDetailsProps> = ({ contrato }) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
            <div>
                <h3 className="text-lg font-bold text-gray-900">{contrato.contratante}</h3>
                <p className="text-sm text-gray-500">{contrato.nome_posto}</p>
            </div>
            <CompanyBadge company={contrato.empresa} />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <StatusBadge active={contrato.status === 'ativo'} />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">Valor Mensal</p>
                <span className="text-lg font-semibold text-green-700">{formatCurrency(contrato.valor_mensal)}</span>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">Início</p>
                <p className="text-gray-900">{new Date(contrato.data_inicio).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">Duração</p>
                <p className="text-gray-900">{contrato.duracao_meses} meses</p>
            </div>
        </div>

        <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Detalhes Financeiros</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Dia Faturamento:</span>
                    <span>{contrato.dia_faturamento}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Dia Vencimento:</span>
                    <span>{contrato.dia_vencimento}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Vence no mês:</span>
                    <span>{contrato.vencimento_mes_corrente ? 'Sim' : 'Não'}</span>
                </div>
            </div>
        </div>

        {/* Retentions View */}
        {(contrato.retencao_iss || contrato.retencao_pis || contrato.retencao_cofins || contrato.retencao_csll || contrato.retencao_irpj || contrato.retencao_inss) && (
            <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Retenções</h4>
                <div className="flex flex-wrap gap-2">
                    {contrato.retencao_iss && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">ISS ({contrato.perc_iss}%)</span>}
                    {contrato.retencao_pis && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">PIS</span>}
                    {contrato.retencao_cofins && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">COFINS</span>}
                    {contrato.retencao_csll && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">CSLL</span>}
                    {contrato.retencao_irpj && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">IRPJ</span>}
                    {contrato.retencao_inss && <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border">INSS</span>}
                </div>
            </div>
        )}
    </div>
);

export default ContratoDetails;
