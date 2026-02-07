import React, { useState, useEffect } from 'react';

import { useModal } from '../../../context/ModalContext';
import { rhService } from '../../../services/rhService';
import type { CargoSalario } from '../types';
import CurrencyInput from '../../../components/CurrencyInput';

interface CargosSalariosFormProps {
    initialData?: CargoSalario;
    onSuccess: () => void;
}

const UFS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
    'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const CargosSalariosForm: React.FC<CargosSalariosFormProps> = ({ initialData, onSuccess }) => {
    const { closeModal, showFeedback } = useModal();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<CargoSalario>>({
        empresa: 'FEMOG',
        cargo: '',
        uf: '',
        salario_base: 0,
        perc_periculosidade: 0,
        perc_insalubridade: 0,
        perc_adc_noturno: 0,
        perc_intrajornada: 0,
        valor_aux_alim: 0,
        perc_desc_alim: 0,
        valor_he_diurno: 0,
        valor_he_noturno: 0
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNumberChange = (name: keyof CargoSalario, value: number) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (initialData?.id) {
                await rhService.updateCargoSalario(initialData.id, formData);
                showFeedback('success', 'Cargo atualizado com sucesso!');
            } else {
                await rhService.createCargoSalario(formData as Omit<CargoSalario, 'id'>);
                showFeedback('success', 'Cargo criado com sucesso!');
            }
            onSuccess();
            closeModal();
        } catch (error) {
            console.error('Erro ao salvar cargo:', error);
            showFeedback('error', 'Erro ao salvar cargo. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção Principal */}
            {/* Seção Principal */}
            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-1 border-b">
                    Dados Principais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Empresa</label>
                        <select
                            name="empresa"
                            value={formData.empresa}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500"
                            required
                        >
                            <option value="FEMOG">FEMOG</option>
                            <option value="SEMOG">SEMOG</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cargo</label>
                        <input
                            type="text"
                            name="cargo"
                            value={formData.cargo || ''}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">UF</label>
                        <select
                            name="uf"
                            value={formData.uf || ''}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500"
                            required
                        >
                            <option value="">Selecione...</option>
                            {UFS.map(uf => (
                                <option key={uf} value={uf}>{uf}</option>
                            ))}
                        </select>
                    </div>

                    <CurrencyInput
                        label="Salário Base"
                        value={formData.salario_base || 0}
                        onChange={(val) => handleNumberChange('salario_base', val)}
                    />
                </div>
            </div>

            {/* Adicionais e Percentuais */}
            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-1 border-b">
                    Adicionais e Percentuais (%)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">% Periculosidade</label>
                        <input
                            type="number"
                            step="0.01"
                            name="perc_periculosidade"
                            value={formData.perc_periculosidade}
                            onChange={(e) => handleNumberChange('perc_periculosidade', parseFloat(e.target.value))}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 text-right"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">% Insalubridade</label>
                        <input
                            type="number"
                            step="0.01"
                            name="perc_insalubridade"
                            value={formData.perc_insalubridade}
                            onChange={(e) => handleNumberChange('perc_insalubridade', parseFloat(e.target.value))}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 text-right"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">% Adc. Noturno</label>
                        <input
                            type="number"
                            step="0.01"
                            name="perc_adc_noturno"
                            value={formData.perc_adc_noturno}
                            onChange={(e) => handleNumberChange('perc_adc_noturno', parseFloat(e.target.value))}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 text-right"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">% Intrajornada</label>
                        <input
                            type="number"
                            step="0.01"
                            name="perc_intrajornada"
                            value={formData.perc_intrajornada}
                            onChange={(e) => handleNumberChange('perc_intrajornada', parseFloat(e.target.value))}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 text-right"
                        />
                    </div>
                </div>
            </div>

            {/* Alimentação */}
            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-1 border-b">
                    Auxílio Alimentação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CurrencyInput
                        label="Valor Aux. Refeição/Alim."
                        value={formData.valor_aux_alim || 0}
                        onChange={(val) => handleNumberChange('valor_aux_alim', val)}
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700">% Desc. Alimentação</label>
                        <input
                            type="number"
                            step="0.01"
                            name="perc_desc_alim"
                            value={formData.perc_desc_alim}
                            onChange={(e) => handleNumberChange('perc_desc_alim', parseFloat(e.target.value))}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 text-right"
                        />
                    </div>
                </div>
            </div>

            {/* Horas Extras */}
            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-1 border-b">
                    Hora Extra (Valores)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CurrencyInput
                        label="Valor HE Diurno"
                        value={formData.valor_he_diurno || 0}
                        onChange={(val) => handleNumberChange('valor_he_diurno', val)}
                    />
                    <CurrencyInput
                        label="Valor HE Noturno"
                        value={formData.valor_he_noturno || 0}
                        onChange={(val) => handleNumberChange('valor_he_noturno', val)}
                    />
                </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col-reverse sm:flex-row justify-end pt-4 gap-3 border-t border-gray-200 mt-6">
                <button
                    type="button"
                    onClick={closeModal}
                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    disabled={loading}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex justify-center items-center transition-colors"
                >
                    {loading ? 'Salvando...' : 'Salvar Cargo'}
                </button>
            </div>
        </form>
    );
};

export default CargosSalariosForm;
