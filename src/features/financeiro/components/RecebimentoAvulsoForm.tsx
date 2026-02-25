import { useState, useEffect, type FC, type FormEvent, type ChangeEvent } from 'react';

import type { Recebimento } from '../types';
import { financeiroService } from '../../../services/financeiroService';
import { useModal } from '../../../context/ModalContext';
import CurrencyInput from '../../../components/CurrencyInput';
import PrimaryButton from '../../../components/PrimaryButton';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';

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
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-1 border-b">Dados Gerais</h3>
                <div className="space-y-4">
                    <SelectField
                        label="Empresa"
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleChange}
                        disabled={initialData?.tipo === 'faturamento'}
                        options={[
                            { value: 'SEMOG', label: 'SEMOG' },
                            { value: 'FEMOG', label: 'FEMOG' }
                        ]}
                    />
                    <InputField
                        label="Descrição"
                        name="descricao"
                        value={formData.descricao}
                        onChange={handleChange}
                        disabled={initialData?.tipo === 'faturamento'}
                        placeholder="Ex: Devolução de Caução"
                        required
                    />
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-1 border-b">Valores</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <CurrencyInput
                            label="Valor do Recebimento"
                            value={formData.valor_base || 0}
                            onChange={(val) => setFormData(prev => ({ ...prev, valor_base: val }))}
                        />
                    </div>
                    <div>
                        <CurrencyInput
                            label="Acréscimos"
                            value={formData.acrescimo || 0}
                            onChange={(val) => setFormData(prev => ({ ...prev, acrescimo: val }))}
                        />
                    </div>
                    <div>
                        <CurrencyInput
                            label="Descontos"
                            value={formData.desconto || 0}
                            onChange={(val) => setFormData(prev => ({ ...prev, desconto: val }))}
                        />
                    </div>
                </div>
                <div className="bg-gray-50 p-3 rounded text-right mt-4 border border-gray-100">
                    <span className="text-sm font-medium text-gray-500 mr-2 uppercase tracking-wide">Total Líquido:</span>
                    <span className="text-xl font-bold text-green-700">
                        R$ {((formData.valor_base || 0) + (formData.acrescimo || 0) - (formData.desconto || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-1 border-b">Datas e Detalhes</h3>
                <div className="space-y-4">
                    <InputField
                        label="Data Recebimento (Previsão)"
                        type="date"
                        name="data_recebimento"
                        value={formData.data_recebimento}
                        onChange={handleChange}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Observações</label>
                        <textarea name="observacoes" rows={3} value={formData.observacoes} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancelar
                </button>
                <PrimaryButton type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Criar Recebimento')}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default RecebimentoAvulsoForm;
