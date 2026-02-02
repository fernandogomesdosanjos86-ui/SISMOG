import { useState, useEffect, type FC, type FormEvent, type ChangeEvent } from 'react';

import type { Recebimento } from '../types';
import { financeiroService } from '../../../services/financeiroService';
import { useModal } from '../../../context/ModalContext';

interface RecebimentoAvulsoFormProps {
    onSuccess?: () => void;
    initialData?: Recebimento;
}

const RecebimentoAvulsoForm: FC<RecebimentoAvulsoFormProps> = ({ onSuccess, initialData }) => {

    const { closeModal, showFeedback } = useModal();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Recebimento>>({
        empresa: 'SEMOG',
        valor_base: 0,
        acrescimo: 0,
        desconto: 0,
        data_recebimento: new Date().toISOString().split('T')[0],
        descricao: '',
        observacoes: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                // Ensure dates are formatted for input type="date"
                data_recebimento: initialData.data_recebimento ? initialData.data_recebimento.split('T')[0] : '',
                valor_base: initialData.valor_recebimento_liquido // Or store base separately? Assuming for now base ~= liquid for simple edits if not storing detailed breakdown for avulso history perfectly.
                // Wait, logic in submit is: liquid = base + acrescimo - desconto.
                // If we Edit, we should try to restore base if we have it. If not, maybe use liquid as base?
                // Recebimento schema has valor_base. Use it if available.
            });
            // Detailed override
            if (initialData.valor_base) {
                setFormData(prev => ({ ...prev, valor_base: initialData.valor_base }));
            } else {
                setFormData(prev => ({ ...prev, valor_base: initialData.valor_recebimento_liquido, acrescimo: initialData.acrescimo || 0, desconto: initialData.desconto || 0 }));
            }

            // If faturamento, pre-fill description if empty
            if (initialData.tipo === 'faturamento' && !initialData.descricao && initialData.faturamentos?.contratos?.contratante) {
                setFormData(prev => ({ ...prev, descricao: `Fatura: ${initialData.faturamentos?.contratos?.contratante}` }));
            }
        }
    }, [initialData]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {

        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e: FormEvent) => {

        e.preventDefault();
        setLoading(true);
        try {
            // Logic handled in service: calculates liquid, competence etc.
            // But we need to pass the base values.
            // Liquid for avulso = base + acrescimo - desconto
            const liquido = (formData.valor_base || 0) + (formData.acrescimo || 0) - (formData.desconto || 0);

            // Calculate competence based on data_recebimento
            const comp = (formData.data_recebimento || '').substring(0, 7) + '-01';

            // Sanitize payload to remove joined objects that cause generic errors in Supabase update
            // (e.g. faturamentos, contratos objects)
            const { faturamentos, ...cleanData } = formData as any;

            const payload = {
                ...cleanData,
                valor_recebimento_liquido: liquido,
                competencia: comp,
            };

            if (initialData?.id) {
                await financeiroService.updateRecebimento(initialData.id, payload as Recebimento);
                showFeedback('success', 'Recebimento atualizado!');
            } else {
                await financeiroService.createRecebimentoAvulso({
                    ...payload,
                    status: 'pendente'
                } as Recebimento);
                showFeedback('success', 'Recebimento avulso criado!');
            }

            onSuccess?.();
            closeModal();
        } catch (error) {
            console.error(error);
            showFeedback('error', 'Erro ao salvar recebimento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Empresa</label>
                <select name="empresa" value={formData.empresa} onChange={handleChange} disabled={initialData?.tipo === 'faturamento'} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500">
                    <option value="SEMOG">SEMOG</option>
                    <option value="FEMOG">FEMOG</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <input required name="descricao" value={formData.descricao} onChange={handleChange} disabled={initialData?.tipo === 'faturamento'} placeholder="Ex: Devolução de Caução" className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Valor do Recebimento</label>
                    <input type="number" step="0.01" required name="valor_base" value={formData.valor_base} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border" />
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

            <div>
                <label className="block text-sm font-medium text-gray-700">Data Recebimento (Previsão)</label>
                <input type="date" required name="data_recebimento" value={formData.data_recebimento} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Observações</label>
                <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border" />
            </div>

            <div className="bg-gray-50 p-3 rounded text-right">
                <span className="text-sm font-medium text-gray-500 mr-2">Total Líquido:</span>
                <span className="text-lg font-bold text-gray-900">
                    R$ {((formData.valor_base || 0) + (formData.acrescimo || 0) - (formData.desconto || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
            </div>

            <div className="flex justify-end pt-4">
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    {loading ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Criar Recebimento')}
                </button>
            </div>
        </form>
    );
};

export default RecebimentoAvulsoForm;
