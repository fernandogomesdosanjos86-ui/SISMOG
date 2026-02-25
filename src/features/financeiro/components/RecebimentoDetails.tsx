import React from 'react';
import type { Recebimento } from '../types';
import { formatCurrency } from '../../../utils/format';
import { Activity, Type, Calendar, DollarSign } from 'lucide-react';
import CompanyBadge from '../../../components/CompanyBadge';

interface RecebimentoDetailsProps {
    recebimento: Recebimento;
}

const RecebimentoDetails: React.FC<RecebimentoDetailsProps> = ({ recebimento }) => (
    <div className="space-y-6">
        <div className="flex items-start justify-between border-b border-gray-100 pb-5">
            <div>
                <h3 className="text-xl font-bold text-gray-900">
                    {recebimento.tipo === 'faturamento' ? `Fatura: ${recebimento.faturamentos?.contratos?.contratante}` : recebimento.descricao}
                </h3>
            </div>
            <CompanyBadge company={recebimento.empresa as any} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    <Activity size={16} className="mr-2" /> Status
                </div>
                <div className="mt-1">
                    <span className={`capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide ${recebimento.status === 'recebido' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {recebimento.status}
                    </span>
                </div>
            </div>
            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex flex-col gap-2">
                <div className="flex items-center text-green-700 text-sm font-medium mb-1">
                    <DollarSign size={16} className="mr-2" /> Valor Líquido
                </div>
                <div className="text-green-900 font-semibold text-lg">{formatCurrency(recebimento.valor_recebimento_liquido)}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    <Type size={16} className="mr-2" /> Tipo
                </div>
                <div className="mt-1">
                    <span className={`capitalize inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${recebimento.tipo === 'avulso' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{recebimento.tipo}</span>
                </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                    <Calendar size={16} className="mr-2" /> {recebimento.status === 'recebido' ? 'Data Pagamento' : 'Vencimento'}
                </div>
                <div className="text-gray-900 font-semibold text-lg">{recebimento.data_recebimento ? new Date(recebimento.data_recebimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</div>
            </div>
        </div>

        {recebimento.tipo === 'faturamento' && recebimento.tem_retencao_caucao && (
            <div className="bg-yellow-50 p-4 rounded-xl text-sm text-yellow-800 border border-yellow-200 mt-2 font-medium">
                Retenção Caução: {formatCurrency(recebimento.valor_retencao_caucao)} ({recebimento.perc_retencao_caucao}%)
            </div>
        )}
    </div>
);

export default RecebimentoDetails;
