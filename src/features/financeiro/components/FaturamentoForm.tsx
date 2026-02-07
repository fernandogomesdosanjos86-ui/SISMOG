import { useState, useEffect, type FC, type FormEvent, type ChangeEvent } from 'react';

import type { Faturamento } from '../types';
import { financeiroService } from '../../../services/financeiroService';
import { useModal } from '../../../context/ModalContext';
import CurrencyInput from '../../../components/CurrencyInput';

interface FaturamentoFormProps {
    initialData: Faturamento;
    onSuccess?: () => void;
}

const FaturamentoForm: FC<FaturamentoFormProps> = ({ initialData, onSuccess }) => {

    const { closeModal, showFeedback } = useModal();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Faturamento>(initialData);

    useEffect(() => {
        // Recalculate logic if needed
    }, [formData]);

    const calculateValues = (current: Faturamento): Faturamento => {
        const bruto = Number(current.valor_base_contrato) + Number(current.acrescimo) - Number(current.desconto);

        // Retentions
        const ret = financeiroService.calculateRetencoes({
            retencao_pis: current.retencao_pis,
            retencao_cofins: current.retencao_cofins,
            retencao_irpj: current.retencao_irpj,
            retencao_csll: current.retencao_csll,
            retencao_inss: current.retencao_inss,
            retencao_iss: current.retencao_iss,
            perc_iss: current.perc_iss
        }, bruto);

        return {
            ...current,
            valor_bruto: bruto,
            valor_retencao_pis: ret.pis,
            valor_retencao_cofins: ret.cofins,
            valor_retencao_irpj: ret.irpj,
            valor_retencao_csll: ret.csll,
            valor_retencao_inss: ret.inss,
            valor_retencao_iss: ret.iss,
            valor_liquido: bruto - ret.totalRetencoes
        };
    };

    const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {

        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {

        e.preventDefault();
        setLoading(true);
        try {
            await financeiroService.updateFaturamento(initialData.id, formData);
            showFeedback('success', 'Faturamento atualizado com sucesso!');
            onSuccess?.();
            closeModal();
        } catch (error) {
            console.error(error);
            showFeedback('error', 'Erro ao atualizar faturamento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-50 p-3 rounded-md mb-4 border border-gray-100">
                <p className="text-sm font-medium text-gray-700">Contrato: <span className="font-bold">{initialData.contratos?.contratante}</span></p>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>{initialData.contratos?.nome_posto}</span>
                    <span>Competência: {new Date(initialData.competencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-1 border-b">Valores e Ajustes</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <CurrencyInput
                            label="Valor Base"
                            value={formData.valor_base_contrato}
                            onChange={() => { }} // Read-only mostly, but required prop
                            disabled
                            className="opacity-75"
                        />
                    </div>
                    <div>
                        <CurrencyInput
                            label="Acréscimos"
                            value={formData.acrescimo}
                            onChange={(val) => setFormData(prev => calculateValues({ ...prev, acrescimo: val }))}
                        />
                    </div>
                    <div>
                        <CurrencyInput
                            label="Descontos"
                            value={formData.desconto}
                            onChange={(val) => setFormData(prev => calculateValues({ ...prev, desconto: val }))}
                        />
                    </div>
                </div>
            </div>

            {/* Read-only Calculations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div>
                    <label className="block text-xs font-semibold text-blue-800 uppercase tracking-wide">Valor Bruto</label>
                    <p className="text-lg font-bold text-blue-900 mt-1">R$ {formData.valor_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-red-800 uppercase tracking-wide">Total Retenções</label>
                    <p className="text-lg font-bold text-red-900 mt-1">R$ {(formData.valor_bruto - formData.valor_liquido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-green-800 uppercase tracking-wide">Valor Líquido</label>
                    <p className="text-lg font-bold text-green-900 mt-1">R$ {formData.valor_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-1 border-b">Datas e Observações</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data Emissão</label>
                        <input type="date" name="data_emissao" value={formData.data_emissao || ''} onChange={handleDateChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Data Vencimento</label>
                        <input type="date" name="data_vencimento" value={formData.data_vencimento || ''} onChange={handleDateChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Observações</label>
                    <textarea name="observacoes" rows={3} value={formData.observacoes || ''} onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
                </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end pt-4 gap-3 border-t border-gray-200 mt-6">
                <button
                    type="button"
                    onClick={closeModal}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex justify-center items-center transition-colors"
                >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

        </form>
    );
};

export default FaturamentoForm;
