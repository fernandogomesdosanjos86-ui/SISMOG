import React, { useState, useEffect } from 'react';

import { useModal } from '../../../context/ModalContext';
import { rhService } from '../../../services/rhService';
import type { CargoSalario } from '../types';
import CurrencyInput from '../../../components/CurrencyInput';
import PrimaryButton from '../../../components/PrimaryButton';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';

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
                    <SelectField
                        label="Empresa"
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleChange}
                        options={[
                            { value: 'FEMOG', label: 'FEMOG' },
                            { value: 'SEMOG', label: 'SEMOG' }
                        ]}
                        required
                    />

                    <InputField
                        label="Cargo"
                        name="cargo"
                        value={formData.cargo || ''}
                        onChange={handleChange}
                        required
                    />

                    <SelectField
                        label="UF"
                        name="uf"
                        value={formData.uf || ''}
                        onChange={handleChange}
                        options={UFS.map(uf => ({ value: uf, label: uf }))}
                        required
                    />

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
                    <InputField
                        label="% Periculosidade"
                        type="number"
                        step="0.01"
                        name="perc_periculosidade"
                        className="text-right"
                        value={formData.perc_periculosidade}
                        onChange={(e) => handleNumberChange('perc_periculosidade', parseFloat(e.target.value) || 0)}
                    />
                    <InputField
                        label="% Insalubridade"
                        type="number"
                        step="0.01"
                        name="perc_insalubridade"
                        className="text-right"
                        value={formData.perc_insalubridade}
                        onChange={(e) => handleNumberChange('perc_insalubridade', parseFloat(e.target.value) || 0)}
                    />
                    <InputField
                        label="% Adc. Noturno"
                        type="number"
                        step="0.01"
                        name="perc_adc_noturno"
                        className="text-right"
                        value={formData.perc_adc_noturno}
                        onChange={(e) => handleNumberChange('perc_adc_noturno', parseFloat(e.target.value) || 0)}
                    />
                    <InputField
                        label="% Intrajornada"
                        type="number"
                        step="0.01"
                        name="perc_intrajornada"
                        className="text-right"
                        value={formData.perc_intrajornada}
                        onChange={(e) => handleNumberChange('perc_intrajornada', parseFloat(e.target.value) || 0)}
                    />
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
                    <InputField
                        label="% Desc. Alimentação"
                        type="number"
                        step="0.01"
                        name="perc_desc_alim"
                        className="text-right"
                        value={formData.perc_desc_alim}
                        onChange={(e) => handleNumberChange('perc_desc_alim', parseFloat(e.target.value) || 0)}
                    />
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
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={loading}
                >
                    Cancelar
                </button>
                <PrimaryButton type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar Cargo'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default CargosSalariosForm;
