import React, { useState, useEffect } from 'react';
import { useAbastecimentos } from '../hooks/useAbastecimentos';
import { useVeiculos } from '../hooks/useVeiculos';
import CurrencyInput from '../../../components/CurrencyInput';
import type { Abastecimento, AbastecimentoFormData } from '../types';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';
import PrimaryButton from '../../../components/PrimaryButton';
import { useModal } from '../../../context/ModalContext';

interface AbastecimentoFormProps {
    initialData?: Abastecimento;
    onSuccess?: () => void;
}

const AbastecimentoForm: React.FC<AbastecimentoFormProps> = ({ initialData, onSuccess }) => {
    const { createAbastecimento, updateAbastecimento, isCreating, isUpdating } = useAbastecimentos();
    const { veiculos, isLoading: isLoadingVeiculos } = useVeiculos();
    const { closeModal } = useModal();

    const [formData, setFormData] = useState<AbastecimentoFormData>({
        data: new Date().toISOString().split('T')[0],
        veiculo_id: '',
        km_atual: '',
        litros: '',
        valor: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                data: initialData.data,
                veiculo_id: initialData.veiculo_id,
                km_atual: initialData.km_atual,
                litros: initialData.litros,
                valor: initialData.valor
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Convert string inputs back to numbers before saving
        const payload: AbastecimentoFormData = {
            ...formData,
            km_atual: formData.km_atual === '' ? 0 : Number(formData.km_atual),
            litros: formData.litros === '' ? 0 : Number(formData.litros),
            valor: formData.valor === '' ? 0 : Number(formData.valor),
        };

        try {
            if (initialData) {
                await updateAbastecimento({ id: initialData.id, data: payload });
            } else {
                await createAbastecimento(payload);
            }
            onSuccess?.();
        } catch (error) {
            // Error handling is managed by the hook and ModalContext feedback
        }
    };

    const isSubmitting = isCreating || isUpdating;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                    label="Data do Abastecimento"
                    type="date"
                    required
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                />

                <SelectField
                    label="Veículo"
                    required
                    value={formData.veiculo_id}
                    onChange={(e) => setFormData({ ...formData, veiculo_id: e.target.value })}
                    disabled={isLoadingVeiculos}
                    options={veiculos
                        .filter(v => v.abastecimento === true)
                        .map(v => ({ value: v.id, label: `${v.marca_modelo} (${v.placa})` }))}
                />

                <InputField
                    label="Km Atual"
                    type="number"
                    step="1"
                    required
                    value={formData.km_atual}
                    onChange={(e) => setFormData({ ...formData, km_atual: e.target.value ? Number(e.target.value) : '' })}
                    placeholder="Ex: 53200"
                    className="font-mono"
                />

                <InputField
                    label="Litros"
                    type="number"
                    step="0.01"
                    required
                    value={formData.litros}
                    onChange={(e) => setFormData({ ...formData, litros: e.target.value ? Number(e.target.value) : '' })}
                    placeholder="Ex: 40.5"
                    className="font-mono"
                />

                <div className="sm:col-span-2">
                    <CurrencyInput
                        label="Valor Total (R$)"
                        value={formData.valor === '' ? 0 : Number(formData.valor)}
                        onChange={(val) => setFormData({ ...formData, valor: val })}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Cancelar
                </button>
                <PrimaryButton
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Lançar Abastecimento'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default AbastecimentoForm;
