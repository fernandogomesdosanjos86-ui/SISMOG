import React from 'react';
import type { Contrato } from '../types';
import { Info, Calendar, DollarSign, CalendarDays, FileText } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import CompanyBadge from '../../../components/CompanyBadge';
import StatusBadge from '../../../components/StatusBadge';

interface ContratoDetailsProps {
    contrato: Contrato;
}

const ContratoDetails: React.FC<ContratoDetailsProps> = ({ contrato }) => (
    <div className="space-y-6">
        <div className="flex items-start justify-between border-b border-gray-100 pb-5">
            <div>
                <h3 className="text-xl font-bold text-gray-900">{contrato.contratante}</h3>
                <p className="text-sm text-gray-500 mt-1">{contrato.nome_posto}</p>
            </div>
            <CompanyBadge company={contrato.empresa} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    <Info size={16} className="mr-2" /> Status
                </div>
                <div className="mt-1"><StatusBadge active={contrato.status === 'ativo'} /></div>
            </div>
            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex flex-col gap-2">
                <div className="flex items-center text-green-700 text-sm font-medium mb-1">
                    <DollarSign size={16} className="mr-2" /> Valor Mensal
                </div>
                <div className="text-green-900 font-semibold text-lg">{formatCurrency(contrato.valor_mensal)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    <Calendar size={16} className="mr-2" /> Início
                </div>
                <div className="text-gray-900 font-semibold text-lg">{new Date(contrato.data_inicio).toLocaleDateString('pt-BR')}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    <CalendarDays size={16} className="mr-2" /> Duração
                </div>
                <div className="text-gray-900 font-semibold text-lg">{contrato.duracao_meses} meses</div>
            </div>
        </div>

        <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm pb-1 border-b">
                <FileText size={16} className="text-blue-500" />
                Detalhes Financeiros
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center">
                    <span className="text-gray-500 font-medium tracking-wide text-xs">Faturamento (Dia)</span>
                    <span className="font-bold text-gray-900 text-base">{contrato.dia_faturamento}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center">
                    <span className="text-gray-500 font-medium tracking-wide text-xs">Vencimento (Dia)</span>
                    <span className="font-bold text-gray-900 text-base">{contrato.dia_vencimento}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border flex justify-between items-center">
                    <span className="text-gray-500 font-medium tracking-wide text-xs">Vence Mês Corrente?</span>
                    <span className="font-bold text-gray-900 text-base">{contrato.vencimento_mes_corrente ? 'Sim' : 'Não'}</span>
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
