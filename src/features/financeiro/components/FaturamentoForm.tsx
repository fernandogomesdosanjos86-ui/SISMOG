import { useState, useEffect, type FC, type FormEvent, type ChangeEvent } from 'react';

import type { Faturamento } from '../types';
import { financeiroService } from '../../../services/financeiroService';
import { useModal } from '../../../context/ModalContext';

interface FaturamentoFormProps {
    initialData: Faturamento;
    onSuccess?: () => void;
}

const FaturamentoForm: FC<FaturamentoFormProps> = ({ initialData, onSuccess }) => {

    const { closeModal, showFeedback } = useModal();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Faturamento>(initialData);

    useEffect(() => {
        // Recalculate if values change? 
        // Logic: if base/acrescimo/desconto changes -> update bruto.
        // if bruto changes -> update retentions (if enabled).
        // if retentions change -> update liquido.

        // However, converting this reactive logic in a simple form might be tricky without a reducer or useEffect chain.
        // Let's do a simple calculation on every change.
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

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {

        const { name, value, type } = e.target;
        const numValue = type === 'number' ? parseFloat(value) : value;

        setFormData(prev => {
            const next = { ...prev, [name]: numValue };
            // Auto-recalculate
            return calculateValues(next as Faturamento);
        });
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
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-md mb-4">
                <p className="text-sm font-medium text-gray-700">Contrato: {initialData.contratos?.contratante}</p>
                <p className="text-xs text-gray-500">{initialData.contratos?.nome_posto}</p>
                <p className="text-xs text-gray-500">Competência: {new Date(initialData.competencia).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Valor Base</label>
                    <input type="number" step="0.01" name="valor_base_contrato" value={formData.valor_base_contrato} disabled className="mt-1 w-full bg-gray-100 rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Acréscimos</label>
                    <input type="number" step="0.01" name="acrescimo" value={formData.acrescimo} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Descontos</label>
                    <input type="number" step="0.01" name="desconto" value={formData.desconto} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
            </div>

            {/* Read-only Calculations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-3 rounded border border-blue-100">
                <div>
                    <label className="block text-xs font-semibold text-blue-800">Valor Bruto</label>
                    <p className="text-lg font-bold text-blue-900">R$ {formData.valor_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-red-800">Total Retenções</label>
                    <p className="text-lg font-bold text-red-900">R$ {(formData.valor_bruto - formData.valor_liquido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-green-800">Valor Líquido</label>
                    <p className="text-lg font-bold text-green-900">R$ {formData.valor_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Data Emissão</label>
                    <input type="date" name="data_emissao" value={formData.data_emissao || ''} onChange={handleDateChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Data Vencimento</label>
                    <input type="date" name="data_vencimento" value={formData.data_vencimento || ''} onChange={handleDateChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Observações</label>
                <textarea name="observacoes" value={formData.observacoes || ''} onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>

            <div className="flex justify-end pt-4">
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </form>
    );
};

export default FaturamentoForm;
