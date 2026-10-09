import React from 'react';
import type { ContaFinanceira } from '../types';
import CompanyBadge from '../../../components/CompanyBadge';
import StatusBadge from '../../../components/StatusBadge';
import { formatCurrency } from '../../../utils/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Wallet, QrCode, ShieldAlert } from 'lucide-react';

interface ContaFinanceiraDetailsProps {
    conta: ContaFinanceira;
}

const ContaFinanceiraDetails: React.FC<ContaFinanceiraDetailsProps> = ({ conta }) => {
    const isCaixaFisico = conta.tipo_conta === 'caixa_fisico';
    const isCorrente = conta.tipo_conta === 'corrente';
    const isNegativo = conta.saldo_atual < 0;

    const tipoNome = isCorrente
        ? 'Conta Corrente'
        : conta.tipo_conta === 'poupanca_aplicacao'
        ? 'Poupança / Aplicação Financeira'
        : 'Caixa Físico (Espécie)';

    const totalDisponivel = isCorrente
        ? conta.saldo_atual + Number(conta.limite_cheque_especial || 0)
        : conta.saldo_atual;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{conta.nome}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{tipoNome}</p>
                </div>
                <div className="flex items-center gap-2">
                    <CompanyBadge company={conta.empresa} />
                    <StatusBadge
                        active={conta.status === 'ativa'}
                        activeLabel="Ativa"
                        inactiveLabel="Inativa"
                    />
                </div>
            </div>

            {/* Grid de Saldos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Saldo Atual */}
                <div
                    className={`p-4 rounded-xl border flex flex-col gap-1 ${
                        isNegativo
                            ? 'bg-rose-50/70 border-rose-200'
                            : 'bg-emerald-50/70 border-emerald-200'
                    }`}
                >
                    <span
                        className={`text-xs font-semibold uppercase tracking-wider ${
                            isNegativo ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                    >
                        Saldo Atual Real
                    </span>
                    <span
                        className={`text-2xl font-bold tracking-tight ${
                            isNegativo ? 'text-rose-700' : 'text-emerald-800'
                        }`}
                    >
                        {formatCurrency(conta.saldo_atual)}
                    </span>
                    {isNegativo && (
                        <span className="text-[11px] text-rose-600 flex items-center gap-1 font-medium mt-1">
                            <ShieldAlert size={12} /> Saldo devedor (utilizando limite)
                        </span>
                    )}
                </div>

                {/* Limite de Cheque Especial (se houver) */}
                {isCorrente && (
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col gap-1">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Limite Cheque Especial
                        </span>
                        <span className="text-2xl font-bold text-gray-800 tracking-tight">
                            {formatCurrency(conta.limite_cheque_especial || 0)}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1">Crédito pré-aprovado</span>
                    </div>
                )}

                {/* Total Disponível (Saldo + Limite) */}
                {isCorrente && Number(conta.limite_cheque_especial || 0) > 0 && (
                    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                            Total Disponível
                        </span>
                        <span className="text-2xl font-bold text-blue-900 tracking-tight">
                            {formatCurrency(totalDisponivel)}
                        </span>
                        <span className="text-[11px] text-blue-600 mt-1">Saldo Real + Limite</span>
                    </div>
                )}
            </div>

            {/* Detalhes Cadastrais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!isCaixaFisico ? (
                    <>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <span className="text-xs text-gray-400 font-medium block">Agência Bancária</span>
                            <span className="text-base font-semibold text-gray-800">
                                {conta.agencia || 'Não informada'}
                            </span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <span className="text-xs text-gray-400 font-medium block">Número da Conta</span>
                            <span className="text-base font-semibold text-gray-800">
                                {conta.conta || 'Não informada'}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="sm:col-span-2 bg-amber-50/60 p-4 rounded-xl border border-amber-200/60 flex items-center gap-3">
                        <Wallet size={20} className="text-amber-600 flex-shrink-0" />
                        <div>
                            <span className="text-xs font-semibold text-amber-900 block">Caixa Físico</span>
                            <span className="text-xs text-amber-700">
                                Recursos mantidos fisicamente na base para despesas miúdas e operacionais imediatas.
                            </span>
                        </div>
                    </div>
                )}

                {conta.chave_pix && (
                    <div className="sm:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center gap-3">
                        <QrCode size={20} className="text-blue-600 flex-shrink-0" />
                        <div>
                            <span className="text-xs text-gray-400 font-medium block">Chave PIX</span>
                            <span className="text-sm font-semibold text-gray-800 select-all">
                                {conta.chave_pix}
                            </span>
                        </div>
                    </div>
                )}

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-400 font-medium block">Saldo de Implantação / Inicial</span>
                    <span className="text-sm font-semibold text-gray-800">
                        {formatCurrency(conta.saldo_inicial)}
                    </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-400 font-medium block">Data de Referência Inicial</span>
                    <span className="text-sm font-semibold text-gray-800">
                        {conta.data_saldo_inicial
                            ? format(new Date(conta.data_saldo_inicial + 'T00:00:00'), 'dd/MM/yyyy', {
                                  locale: ptBR
                              })
                            : '-'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ContaFinanceiraDetails;
