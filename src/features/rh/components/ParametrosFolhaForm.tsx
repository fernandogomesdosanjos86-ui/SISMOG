import React, { useState } from 'react';
import { useModal } from '../../../context/ModalContext';
import { useParametrosFolha } from '../hooks/useParametrosFolha';
import type { ParametrosFolha, ParametrosFolhaFormData } from '../types';
import PrimaryButton from '../../../components/PrimaryButton';
import CurrencyInput from '../../../components/CurrencyInput';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';

interface ParametrosFolhaFormProps {
    initialData?: ParametrosFolha;
    onSuccess?: () => void;
}

const ParametrosFolhaForm: React.FC<ParametrosFolhaFormProps> = ({ initialData, onSuccess }) => {
    const { closeModal, showFeedback } = useModal();
    const { create, update, isCreating, isUpdating } = useParametrosFolha();

    // Generate years from current - 3 to current + 5
    const currentYear = new Date().getFullYear();
    const yearsOptions = Array.from({ length: 9 }, (_, i) => {
        const yr = currentYear - 3 + i;
        return { value: yr, label: String(yr) };
    });

    const [formData, setFormData] = useState<ParametrosFolhaFormData>({
        ano: initialData?.ano || currentYear,
        valor_salario_minimo: initialData?.valor_salario_minimo || 0,
        teto_salario_familia: initialData?.teto_salario_familia || 0,
        valor_salario_familia: initialData?.valor_salario_familia || 0,
        
        teto_inss_1: initialData?.teto_inss_1 || 0,
        aliquota_inss_1: initialData?.aliquota_inss_1 || 0,
        desconto_inss_1: initialData?.desconto_inss_1 || 0,
        
        teto_inss_2: initialData?.teto_inss_2 || 0,
        aliquota_inss_2: initialData?.aliquota_inss_2 || 0,
        desconto_inss_2: initialData?.desconto_inss_2 || 0,
        
        teto_inss_3: initialData?.teto_inss_3 || 0,
        aliquota_inss_3: initialData?.aliquota_inss_3 || 0,
        desconto_inss_3: initialData?.desconto_inss_3 || 0,
        
        teto_inss_4: initialData?.teto_inss_4 || 0,
        aliquota_inss_4: initialData?.aliquota_inss_4 || 0,
        desconto_inss_4: initialData?.desconto_inss_4 || 0,
    });

    const handleNumberChange = (name: keyof ParametrosFolhaFormData, val: number) => {
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleStringChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const numVal = value ? Number(value) : 0;
        setFormData(prev => ({ ...prev, [name]: numVal }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.ano || formData.valor_salario_minimo <= 0) {
            showFeedback('error', 'Por favor preencha os campos obrigatórios (Ano, Salário Mínimo).');
            return;
        }

        try {
            if (initialData) {
                await update({ id: initialData.id, data: formData });
                showFeedback('success', 'Parâmetros atualizados com sucesso!');
            } else {
                await create(formData);
                showFeedback('success', 'Parâmetros cadastrados com sucesso!');
            }
            if (onSuccess) onSuccess();
            closeModal();
        } catch (error) {
            console.error(error);
            showFeedback('error', 'Erro ao salvar os parâmetros. Verifique se o ano já está cadastrado.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
            {/* Informações Gerais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                    label="Ano base"
                    name="ano"
                    value={formData.ano}
                    onChange={handleStringChange}
                    options={yearsOptions}
                    required
                />

                <CurrencyInput
                    label="Valor Salário Mínimo"
                    value={formData.valor_salario_minimo}
                    onChange={(val) => handleNumberChange('valor_salario_minimo', val)}
                    name="valor_salario_minimo"
                />

                <CurrencyInput
                    label="Teto Salário Família"
                    value={formData.teto_salario_familia}
                    onChange={(val) => handleNumberChange('teto_salario_familia', val)}
                    name="teto_salario_familia"
                />

                <CurrencyInput
                    label="Valor Salário Família"
                    value={formData.valor_salario_familia}
                    onChange={(val) => handleNumberChange('valor_salario_familia', val)}
                    name="valor_salario_familia"
                />
            </div>

            {/* Faixa 1 */}
            <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-blue-700 mb-3 uppercase tracking-wider">INSS - Faixa 1</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CurrencyInput
                        label="Teto INSS 1"
                        value={formData.teto_inss_1}
                        onChange={(val) => handleNumberChange('teto_inss_1', val)}
                    />
                    <InputField
                        label="Alíquota INSS 1 (%)"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        name="aliquota_inss_1"
                        value={formData.aliquota_inss_1}
                        onChange={handleStringChange}
                        placeholder="Ex: 7.50"
                    />
                    <CurrencyInput
                        label="Desconto INSS 1"
                        value={formData.desconto_inss_1}
                        onChange={(val) => handleNumberChange('desconto_inss_1', val)}
                    />
                </div>
            </div>

            {/* Faixa 2 */}
            <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-blue-700 mb-3 uppercase tracking-wider">INSS - Faixa 2</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CurrencyInput
                        label="Teto INSS 2"
                        value={formData.teto_inss_2}
                        onChange={(val) => handleNumberChange('teto_inss_2', val)}
                    />
                    <InputField
                        label="Alíquota INSS 2 (%)"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        name="aliquota_inss_2"
                        value={formData.aliquota_inss_2}
                        onChange={handleStringChange}
                        placeholder="Ex: 9.00"
                    />
                    <CurrencyInput
                        label="Desconto INSS 2"
                        value={formData.desconto_inss_2}
                        onChange={(val) => handleNumberChange('desconto_inss_2', val)}
                    />
                </div>
            </div>

            {/* Faixa 3 */}
            <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-blue-700 mb-3 uppercase tracking-wider">INSS - Faixa 3</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CurrencyInput
                        label="Teto INSS 3"
                        value={formData.teto_inss_3}
                        onChange={(val) => handleNumberChange('teto_inss_3', val)}
                    />
                    <InputField
                        label="Alíquota INSS 3 (%)"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        name="aliquota_inss_3"
                        value={formData.aliquota_inss_3}
                        onChange={handleStringChange}
                        placeholder="Ex: 12.00"
                    />
                    <CurrencyInput
                        label="Desconto INSS 3"
                        value={formData.desconto_inss_3}
                        onChange={(val) => handleNumberChange('desconto_inss_3', val)}
                    />
                </div>
            </div>

            {/* Faixa 4 */}
            <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-semibold text-blue-700 mb-3 uppercase tracking-wider">INSS - Faixa 4</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <CurrencyInput
                        label="Teto INSS 4"
                        value={formData.teto_inss_4}
                        onChange={(val) => handleNumberChange('teto_inss_4', val)}
                    />
                    <InputField
                        label="Alíquota INSS 4 (%)"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        name="aliquota_inss_4"
                        value={formData.aliquota_inss_4}
                        onChange={handleStringChange}
                        placeholder="Ex: 14.00"
                    />
                    <CurrencyInput
                        label="Desconto INSS 4"
                        value={formData.desconto_inss_4}
                        onChange={(val) => handleNumberChange('desconto_inss_4', val)}
                    />
                </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6 sticky bottom-0 bg-white z-10">
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancelar
                </button>
                <PrimaryButton type="submit" disabled={isCreating || isUpdating}>
                    {isCreating || isUpdating ? 'Salvando...' : 'Salvar Parâmetros'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default ParametrosFolhaForm;
