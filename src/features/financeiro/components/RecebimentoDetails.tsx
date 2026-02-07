import React from 'react';
import type { Recebimento } from '../types';
import { formatCurrency } from '../../../utils/format';

interface RecebimentoDetailsProps {
    recebimento: Recebimento;
}

const RecebimentoDetails: React.FC<RecebimentoDetailsProps> = ({ recebimento }) => (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <div className="mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full uppercase font-bold tracking-wide ${recebimento.status === 'recebido' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {recebimento.status}
                    </span>
                </div>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">Tipo</p>
                <span className={`capitalize px-2 py-0.5 rounded text-xs ${recebimento.tipo === 'avulso' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'}`}>{recebimento.tipo}</span>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">Origem/Descrição</p>
                <p className="text-base text-gray-900">{recebimento.tipo === 'faturamento' ? `Fatura: ${recebimento.faturamentos?.contratos?.contratante}` : recebimento.descricao}</p>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">Empresa</p>
                <p className="text-base text-gray-900">{recebimento.empresa}</p>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">Valor Líquido</p>
                <p className="text-base font-bold text-green-700">{formatCurrency(recebimento.valor_recebimento_liquido)}</p>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">Vencimento/Data</p>
                <p className="text-base text-gray-900">{recebimento.data_recebimento ? new Date(recebimento.data_recebimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</p>
            </div>
        </div>
        {recebimento.tipo === 'faturamento' && recebimento.tem_retencao_caucao && (
            <div className="bg-yellow-50 p-2 rounded text-sm text-yellow-800 border border-yellow-200">
                Retenção Caução: {formatCurrency(recebimento.valor_retencao_caucao)} ({recebimento.perc_retencao_caucao}%)
            </div>
        )}
    </div>
);

export default RecebimentoDetails;
