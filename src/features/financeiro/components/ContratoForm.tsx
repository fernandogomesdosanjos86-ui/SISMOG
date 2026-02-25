import { useState, useEffect, type FC, type FormEvent, type ChangeEvent } from 'react';

import type { Contrato } from '../types';
import { financeiroService } from '../../../services/financeiroService';
import { useModal } from '../../../context/ModalContext';
import CurrencyInput from '../../../components/CurrencyInput';
import PrimaryButton from '../../../components/PrimaryButton';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';

interface ContratoFormProps {
    initialData?: Contrato;
    onSuccess?: () => void;
}

const ContratoForm: FC<ContratoFormProps> = ({ initialData, onSuccess }) => {
    console.log('Rendering ContratoForm');
    const { closeModal, showFeedback } = useModal();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Contrato>>({
        empresa: 'SEMOG',
        contratante: '',
        nome_posto: '',
        data_inicio: '',
        duracao_meses: 12,
        valor_mensal: 0,
        dia_faturamento: 25,
        dia_vencimento: 5,
        vencimento_mes_corrente: false,
        perc_iss: 0,
        retencao_iss: false,
        retencao_pis: false,
        retencao_cofins: false,
        retencao_irpj: false,
        retencao_csll: false,
        retencao_inss: false,
        tem_retencao_caucao: false,
        perc_retencao_caucao: 0,
        status: 'ativo'
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const calculateTermino = () => {
        if (!formData.data_inicio || !formData.duracao_meses) return '-';
        const date = new Date(formData.data_inicio);
        date.setMonth(date.getMonth() + formData.duracao_meses);
        return date.toLocaleDateString('pt-BR');
    };

    const handleSubmit = async (e: FormEvent) => {

        e.preventDefault();
        setLoading(true);
        try {
            if (initialData?.id) {
                await financeiroService.updateContrato(initialData.id, formData);
                showFeedback('success', 'Contrato atualizado com sucesso!');
            } else {
                await financeiroService.createContrato(formData as Contrato);
                showFeedback('success', 'Contrato criado com sucesso!');
            }
            onSuccess?.();
            closeModal();
        } catch (error) {
            console.error(error);
            showFeedback('error', `Erro ao salvar contrato: ${(error as any).message || 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked :
                type === 'number' ? parseFloat(value) : value
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Info */}
                <SelectField
                    label="Empresa"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleChange}
                    options={[
                        { value: 'SEMOG', label: 'SEMOG' },
                        { value: 'FEMOG', label: 'FEMOG' }
                    ]}
                />
                <InputField
                    label="Contratante"
                    name="contratante"
                    value={formData.contratante}
                    onChange={handleChange}
                    required
                />
                <InputField
                    label="Posto/Serviço"
                    name="nome_posto"
                    value={formData.nome_posto}
                    onChange={handleChange}
                    required
                />
                <SelectField
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={[
                        { value: 'ativo', label: 'Ativo' },
                        { value: 'inativo', label: 'Inativo' }
                    ]}
                />

                {/* Dates & Values */}
                <div>
                    <InputField
                        label="Data Início"
                        type="date"
                        name="data_inicio"
                        value={formData.data_inicio}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <InputField
                        label="Duração (meses)"
                        type="number"
                        name="duracao_meses"
                        value={formData.duracao_meses}
                        onChange={handleChange}
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">Término previsto: {calculateTermino()}</p>
                </div>
                <div>
                    <CurrencyInput
                        label="Valor Mensal (R$)"
                        value={formData.valor_mensal || 0}
                        onChange={(val) => setFormData(prev => ({ ...prev, valor_mensal: val }))}
                    />
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-1 border-b">Faturamento e Vencimento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <InputField
                            label="Dia Faturamento"
                            type="number"
                            min="1"
                            max="31"
                            name="dia_faturamento"
                            value={formData.dia_faturamento}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <InputField
                            label="Dia Vencimento"
                            type="number"
                            min="1"
                            max="31"
                            name="dia_vencimento"
                            value={formData.dia_vencimento}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="flex items-center mt-6">
                        <input type="checkbox" name="vencimento_mes_corrente" checked={formData.vencimento_mes_corrente} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500" />
                        <label className="ml-2 block text-sm text-gray-700">Vence no mesmo mês?</label>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-1 border-b">Retenções e Impostos</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <InputField
                            label="Percentual ISS (%)"
                            type="number"
                            step="0.01"
                            name="perc_iss"
                            value={formData.perc_iss}
                            onChange={handleChange}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="flex items-center mt-6">
                        <input type="checkbox" name="retencao_iss" checked={formData.retencao_iss} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500" />
                        <label className="ml-2 block text-sm text-gray-700">Reter ISS na fonte?</label>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center">
                        <input type="checkbox" name="retencao_pis" checked={formData.retencao_pis} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500" />
                        <label className="ml-2 block text-sm text-gray-700">PIS (0,65%)</label>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="retencao_cofins" checked={formData.retencao_cofins} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500" />
                        <label className="ml-2 block text-sm text-gray-700">COFINS (3%)</label>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="retencao_irpj" checked={formData.retencao_irpj} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500" />
                        <label className="ml-2 block text-sm text-gray-700">IRPJ (1%)</label>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="retencao_csll" checked={formData.retencao_csll} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500" />
                        <label className="ml-2 block text-sm text-gray-700">CSLL (1%)</label>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="retencao_inss" checked={formData.retencao_inss} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500" />
                        <label className="ml-2 block text-sm text-gray-700">INSS (11%)</label>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" name="tem_retencao_caucao" checked={formData.tem_retencao_caucao} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500" />
                        <label className="block text-sm text-gray-700 w-24">Caução?</label>
                        <input
                            type="number" step="0.01"
                            name="perc_retencao_caucao"
                            disabled={!formData.tem_retencao_caucao}
                            value={formData.perc_retencao_caucao} onChange={handleChange}
                            placeholder="%"
                            className="w-20 rounded-md border-gray-300 shadow-sm p-1 border focus:border-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-500">%</span>
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
                    {loading ? 'Salvando...' : 'Salvar Contrato'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default ContratoForm;
