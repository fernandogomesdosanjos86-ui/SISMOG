import { useState, useEffect, type FC, type FormEvent } from 'react';
import type { ContaFinanceira, ContaFinanceiraFormData, TipoContaFinanceira, Empresa } from '../types';
import { useModal } from '../../../context/ModalContext';
import CurrencyInput from '../../../components/CurrencyInput';
import PrimaryButton from '../../../components/PrimaryButton';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';
import { Wallet, ShieldAlert } from 'lucide-react';

interface ContaFinanceiraFormProps {
    onSuccess?: () => void;
    initialData?: ContaFinanceira;
}

const ContaFinanceiraForm: FC<ContaFinanceiraFormProps> = ({ onSuccess, initialData }) => {
    const { closeModal, showFeedback } = useModal();
    const [loading, setLoading] = useState(false);

    // Estado do formulário
    const [empresa, setEmpresa] = useState<Empresa>(initialData?.empresa || 'SEMOG');
    const [nome, setNome] = useState(initialData?.nome || '');
    const [tipoConta, setTipoConta] = useState<TipoContaFinanceira>(initialData?.tipo_conta || 'corrente');
    const [agencia, setAgencia] = useState(initialData?.agencia || '');
    const [conta, setConta] = useState(initialData?.conta || '');
    const [chavePix, setChavePix] = useState(initialData?.chave_pix || '');
    
    // Saldo inicial e controle de sinal
    const rawSaldoInicial = initialData ? Number(initialData.saldo_inicial || 0) : 0;
    const [saldoInicialValor, setSaldoInicialValor] = useState<number>(Math.abs(rawSaldoInicial));
    const [isSaldoNegativo, setIsSaldoNegativo] = useState<boolean>(rawSaldoInicial < 0);

    const [dataSaldoInicial, setDataSaldoInicial] = useState(
        initialData?.data_saldo_inicial
            ? initialData.data_saldo_inicial.split('T')[0]
            : new Date().toISOString().split('T')[0]
    );

    const [limiteChequeEspecial, setLimiteChequeEspecial] = useState<number>(
        initialData ? Number(initialData.limite_cheque_especial || 0) : 0
    );

    const [status, setStatus] = useState<'ativa' | 'inativa'>(initialData?.status || 'ativa');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Se mudar para Poupança ou Caixa Físico, força saldo positivo e zera limite
    useEffect(() => {
        if (tipoConta !== 'corrente') {
            setIsSaldoNegativo(false);
            setLimiteChequeEspecial(0);
        }
        if (tipoConta === 'caixa_fisico') {
            setAgencia('');
            setConta('');
        }
    }, [tipoConta]);

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!nome.trim()) {
            errs.nome = 'Nome da conta / instituição é obrigatório.';
        }
        if (!dataSaldoInicial) {
            errs.dataSaldoInicial = 'Data do saldo inicial é obrigatória.';
        }
        if (tipoConta !== 'corrente' && isSaldoNegativo) {
            errs.saldoInicial = 'Apenas Conta Corrente pode iniciar com saldo negativo.';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const finalSaldoInicial = isSaldoNegativo ? -Math.abs(saldoInicialValor) : Math.abs(saldoInicialValor);

            const payload: ContaFinanceiraFormData = {
                empresa,
                nome: nome.trim(),
                tipo_conta: tipoConta,
                agencia: tipoConta === 'caixa_fisico' ? null : (agencia.trim() || null),
                conta: tipoConta === 'caixa_fisico' ? null : (conta.trim() || null),
                chave_pix: chavePix.trim() || null,
                saldo_inicial: finalSaldoInicial,
                data_saldo_inicial: dataSaldoInicial,
                limite_cheque_especial: tipoConta === 'corrente' ? Number(limiteChequeEspecial || 0) : 0,
                status
            };

            const { financeiroService } = await import('../../../services/financeiroService');

            if (initialData?.id) {
                await financeiroService.updateContaFinanceira(initialData.id, payload);
                showFeedback('success', 'Conta financeira atualizada com sucesso!');
            } else {
                await financeiroService.createContaFinanceira(payload);
                showFeedback('success', 'Conta financeira criada com sucesso!');
            }

            onSuccess?.();
            closeModal();
        } catch (error: any) {
            console.error('Erro ao salvar conta financeira:', error);
            showFeedback('error', error?.message || 'Erro ao salvar conta financeira.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Linha 1: Empresa e Tipo de Conta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                    label="Empresa *"
                    name="empresa"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value as Empresa)}
                    options={[
                        { label: 'SEMOG', value: 'SEMOG' },
                        { label: 'FEMOG', value: 'FEMOG' }
                    ]}
                />

                <SelectField
                    label="Tipo de Conta *"
                    name="tipo_conta"
                    value={tipoConta}
                    onChange={(e) => setTipoConta(e.target.value as TipoContaFinanceira)}
                    options={[
                        { label: 'Conta Corrente', value: 'corrente' },
                        { label: 'Poupança / Aplicação', value: 'poupanca_aplicacao' },
                        { label: 'Caixa Físico (Espécie)', value: 'caixa_fisico' }
                    ]}
                />
            </div>

            {/* Linha 2: Nome da Conta / Instituição */}
            <InputField
                label="Nome da Conta / Instituição *"
                name="nome"
                placeholder="Ex: Sicredi, Sicoob - Operacional, Cora, Caixa da Base"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                error={errors.nome}
            />

            {/* Linha 3: Agência e Conta (apenas se não for Caixa Físico) */}
            {tipoConta !== 'caixa_fisico' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                        label="Agência"
                        name="agencia"
                        placeholder="Ex: 0001"
                        value={agencia}
                        onChange={(e) => setAgencia(e.target.value)}
                    />
                    <InputField
                        label="Número da Conta"
                        name="conta"
                        placeholder="Ex: 12345-6"
                        value={conta}
                        onChange={(e) => setConta(e.target.value)}
                    />
                </div>
            ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                    <Wallet size={16} className="text-amber-600 flex-shrink-0" />
                    <span>Conta do tipo Caixa Físico não possui agência e conta bancária vinculada.</span>
                </div>
            )}

            {/* Linha 4: Chave PIX */}
            <InputField
                label="Chave PIX (Opcional)"
                name="chave_pix"
                placeholder="Ex: financeiro@semog.com.br, CNPJ ou celular"
                value={chavePix}
                onChange={(e) => setChavePix(e.target.value)}
            />

            {/* Linha 5: Saldo Inicial e Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-gray-700">Saldo Inicial *</label>
                        {tipoConta === 'corrente' && (
                            <div className="inline-flex rounded-md shadow-sm" role="group">
                                <button
                                    type="button"
                                    onClick={() => setIsSaldoNegativo(false)}
                                    className={`px-2 py-0.5 text-xs font-semibold rounded-l-md border ${
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
                                    className={`px-2 py-0.5 text-xs font-semibold rounded-r-md border-t border-b border-r ${
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
                        value={saldoInicialValor}
                        onChange={(val) => setSaldoInicialValor(val)}
                        placeholder="R$ 0,00"
                        error={errors.saldoInicial}
                    />

                    {isSaldoNegativo && (
                        <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                            <ShieldAlert size={12} /> Saldo devedor: conta iniciando no cheque especial (-R$).
                        </p>
                    )}
                </div>

                <div>
                    <InputField
                        label="Data do Saldo Inicial *"
                        name="data_saldo_inicial"
                        type="date"
                        value={dataSaldoInicial}
                        onChange={(e) => setDataSaldoInicial(e.target.value)}
                        error={errors.dataSaldoInicial}
                    />
                </div>
            </div>

            {/* Linha 6: Limite de Cheque Especial (Apenas Conta Corrente) e Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tipoConta === 'corrente' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Limite do Cheque Especial (Opcional)
                        </label>
                        <CurrencyInput
                            value={limiteChequeEspecial}
                            onChange={(val) => setLimiteChequeEspecial(val)}
                            placeholder="R$ 0,00"
                        />
                        <p className="text-[11px] text-gray-500 mt-1">
                            Não soma no saldo real. Usado para cálculo do total disponível.
                        </p>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Limite do Cheque Especial
                        </label>
                        <input
                            type="text"
                            disabled
                            value="Não aplicável"
                            className="w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-400 rounded-lg text-sm cursor-not-allowed"
                        />
                    </div>
                )}

                <SelectField
                    label="Status da Conta *"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ativa' | 'inativa')}
                    options={[
                        { label: 'Ativa', value: 'ativa' },
                        { label: 'Inativa', value: 'inativa' }
                    ]}
                />
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={loading}
                >
                    Cancelar
                </button>
                <PrimaryButton type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Criar Conta'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default ContaFinanceiraForm;
