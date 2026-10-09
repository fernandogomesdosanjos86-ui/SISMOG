import { useState, useMemo, type FC, type FormEvent } from 'react';
import type { ContaFinanceira } from '../types';
import { useModal } from '../../../context/ModalContext';
import { useAuth } from '../../../context/AuthContext';
import { financeiroService } from '../../../services/financeiroService';
import CurrencyInput from '../../../components/CurrencyInput';
import PrimaryButton from '../../../components/PrimaryButton';
import { InputField } from '../../../components/forms/InputField';
import CompanyBadge from '../../../components/CompanyBadge';
import { formatCurrency } from '../../../utils/format';
import { Scale, ArrowUpCircle, ArrowDownCircle, CheckCircle2, AlertCircle } from 'lucide-react';

interface AjusteSaldoModalProps {
    conta: ContaFinanceira;
    onSuccess?: () => void;
}

const AjusteSaldoModal: FC<AjusteSaldoModalProps> = ({ conta, onSuccess }) => {
    const { closeModal, showFeedback } = useModal();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Saldo atual no sistema
    const saldoAtualSistema = Number(conta.saldo_atual || 0);

    // Saldo real no extrato digitado
    const [saldoRealValor, setSaldoRealValor] = useState<number>(Math.abs(saldoAtualSistema));
    const [isSaldoNegativo, setIsSaldoNegativo] = useState<boolean>(saldoAtualSistema < 0);

    const [dataAjuste, setDataAjuste] = useState(new Date().toISOString().split('T')[0]);
    const [motivo, setMotivo] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Saldo final informado com sinal
    const saldoRealCalculado = isSaldoNegativo ? -Math.abs(saldoRealValor) : Math.abs(saldoRealValor);

    // Diferença em tempo real: Saldo Real - Saldo Atual
    const diferenca = useMemo(() => {
        return Math.round((saldoRealCalculado - saldoAtualSistema) * 100) / 100;
    }, [saldoRealCalculado, saldoAtualSistema]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!dataAjuste) {
            setError('Informe a data do ajuste.');
            return;
        }

        if (diferenca === 0) {
            setError('O saldo informado é igual ao saldo atual do sistema. Não há ajuste a ser realizado.');
            return;
        }

        setLoading(true);
        try {
            const usuarioNome =
                (user?.user_metadata?.['nome'] as string) ||
                (user?.user_metadata?.['full_name'] as string) ||
                user?.email ||
                'Usuário do Sistema';

            await financeiroService.ajustarSaldoConta(
                conta.id,
                {
                    saldo_real: saldoRealCalculado,
                    data_ajuste: dataAjuste,
                    motivo: motivo.trim() || 'Ajuste de conciliação bancária'
                },
                {
                    id: user?.id,
                    nome: usuarioNome
                }
            );

            showFeedback(
                'success',
                `Saldo da conta "${conta.nome}" ajustado para ${formatCurrency(saldoRealCalculado)} com sucesso!`
            );
            onSuccess?.();
            closeModal();
        } catch (err: any) {
            console.error('Erro ao ajustar saldo:', err);
            setError(err?.message || 'Erro ao realizar o ajuste de conciliação.');
            showFeedback('error', err?.message || 'Erro ao ajustar saldo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Cabeçalho da Conta */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-base">{conta.nome}</h4>
                        <CompanyBadge company={conta.empresa} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {conta.tipo_conta === 'corrente'
                            ? `Conta Corrente • Ag: ${conta.agencia || '-'} • Cc: ${conta.conta || '-'}`
                            : conta.tipo_conta === 'poupanca_aplicacao'
                            ? 'Poupança / Aplicação Financeira'
                            : 'Caixa Físico (Espécie)'}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-xs text-gray-500 block">Saldo no Sistema</span>
                    <span
                        className={`text-lg font-bold tracking-tight ${
                            saldoAtualSistema >= 0 ? 'text-gray-900' : 'text-rose-600'
                        }`}
                    >
                        {formatCurrency(saldoAtualSistema)}
                    </span>
                </div>
            </div>

            {/* Input do Saldo Real no Extrato */}
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-gray-800">
                        Saldo Real no Extrato / Caixa Hoje *
                    </label>
                    {conta.tipo_conta === 'corrente' && (
                        <div className="inline-flex rounded-md shadow-sm" role="group">
                            <button
                                type="button"
                                onClick={() => setIsSaldoNegativo(false)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-l-md border ${
                                    !isSaldoNegativo
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                + Positivo
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsSaldoNegativo(true)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-r-md border-t border-b border-r ${
                                    isSaldoNegativo
                                        ? 'bg-rose-600 text-white border-rose-600'
                                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                - Devedor
                            </button>
                        </div>
                    )}
                </div>

                <CurrencyInput
                    value={saldoRealValor}
                    onChange={(val) => setSaldoRealValor(val)}
                    placeholder="R$ 0,00"
                />
            </div>

            {/* Card de Cálculo da Diferença em Tempo Real */}
            <div
                className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                    diferenca > 0
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : diferenca < 0
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div
                        className={`p-2 rounded-lg ${
                            diferenca > 0
                                ? 'bg-emerald-100 text-emerald-700'
                                : diferenca < 0
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-gray-200 text-gray-600'
                        }`}
                    >
                        {diferenca > 0 ? (
                            <ArrowUpCircle size={22} />
                        ) : diferenca < 0 ? (
                            <ArrowDownCircle size={22} />
                        ) : (
                            <CheckCircle2 size={22} />
                        )}
                    </div>
                    <div>
                        <span className="text-xs font-semibold uppercase tracking-wider block opacity-75">
                            {diferenca > 0
                                ? 'Ajuste de Crédito (Receita de Conciliação)'
                                : diferenca < 0
                                ? 'Ajuste de Débito (Despesa de Conciliação)'
                                : 'Sem Diferença'}
                        </span>
                        <p className="text-xs opacity-90 mt-0.5">
                            {diferenca > 0
                                ? 'O sistema lançará uma entrada para igualar o saldo ao extrato real.'
                                : diferenca < 0
                                ? 'O sistema lançará uma saída para igualar o saldo ao extrato real.'
                                : 'O saldo informado é exatamente igual ao saldo do sistema.'}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <span className="text-xs block opacity-75">Diferença</span>
                    <span
                        className={`text-lg font-bold ${
                            diferenca > 0
                                ? 'text-emerald-700'
                                : diferenca < 0
                                ? 'text-rose-700'
                                : 'text-gray-700'
                        }`}
                    >
                        {diferenca > 0 ? `+${formatCurrency(diferenca)}` : formatCurrency(diferenca)}
                    </span>
                </div>
            </div>

            {/* Linha: Data e Motivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                    label="Data do Ajuste *"
                    name="data_ajuste"
                    type="date"
                    value={dataAjuste}
                    onChange={(e) => setDataAjuste(e.target.value)}
                />

                <InputField
                    label="Motivo / Justificativa"
                    name="motivo"
                    placeholder="Ex: Conciliação de extrato, tarifas, etc."
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                />
            </div>

            {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Ações */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                >
                    Cancelar
                </button>
                <PrimaryButton type="submit" disabled={loading || diferenca === 0}>
                    <Scale size={16} className="mr-2" />
                    {loading ? 'Ajustando...' : 'Confirmar Ajuste'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default AjusteSaldoModal;
