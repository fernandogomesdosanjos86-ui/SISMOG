import React, { useState, useEffect } from 'react';
import { useAbastecimentos } from '../hooks/useAbastecimentos';
import { useVeiculos } from '../hooks/useVeiculos';
import CurrencyInput from '../../../components/CurrencyInput';
import type { Abastecimento, AbastecimentoFormData } from '../types';

interface AbastecimentoFormProps {
    initialData?: Abastecimento;
    onSuccess?: () => void;
}

const AbastecimentoForm: React.FC<AbastecimentoFormProps> = ({ initialData, onSuccess }) => {
    const { createAbastecimento, updateAbastecimento, isCreating, isUpdating } = useAbastecimentos();
    const { veiculos, isLoading: isLoadingVeiculos } = useVeiculos();

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
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data do Abastecimento
                    </label>
                    <input
                        type="date"
                        required
                        value={formData.data}
                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Veículo
                    </label>
                    <select
                        required
                        value={formData.veiculo_id}
                        onChange={(e) => setFormData({ ...formData, veiculo_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoadingVeiculos}
                    >
                        <option value="">Selecione um veículo</option>
                        {veiculos
                            .filter(v => v.abastecimento === true) // Only vehicles that can be fueled
                            .map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.marca_modelo} ({v.placa})
                                </option>
                            ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Km Atual
                    </label>
                    <input
                        type="number"
                        step="1"
                        required
                        value={formData.km_atual}
                        onChange={(e) => setFormData({ ...formData, km_atual: e.target.value ? Number(e.target.value) : '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="Ex: 53200"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Litros
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.litros}
                        onChange={(e) => setFormData({ ...formData, litros: e.target.value ? Number(e.target.value) : '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="Ex: 40.5"
                    />
                </div>

                <div className="sm:col-span-2">
                    <CurrencyInput
                        label="Valor Total (R$)"
                        value={formData.valor === '' ? 0 : Number(formData.valor)}
                        onChange={(val) => setFormData({ ...formData, valor: val })}
                    />
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                >
                    {isSubmitting ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Lançar Abastecimento'}
                </button>
            </div>
        </form>
    );
};

export default AbastecimentoForm;
