import React, { useState } from 'react';
import { useModal } from '../../../context/ModalContext';
import { useFuncionarios } from '../hooks/useFuncionarios';
import { useGratificacoes } from '../hooks/useGratificacoes';
import type { Gratificacao, GratificacaoFormData, TipoGratificacao } from '../types';
import PrimaryButton from '../../../components/PrimaryButton';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';

interface GratificacaoFormProps {
    initialData?: Gratificacao;
    onSuccess?: () => void;
}

const GratificacaoForm: React.FC<GratificacaoFormProps> = ({ initialData, onSuccess }) => {
    const { closeModal, showFeedback } = useModal();
    const { create, update, isCreating, isUpdating } = useGratificacoes();
    const { funcionarios, isLoading: isLoadingFunc } = useFuncionarios();

    const [formData, setFormData] = useState<GratificacaoFormData>({
        empresa: initialData?.empresa || 'FEMOG',
        funcionario_id: initialData?.funcionario_id || '',
        data: initialData?.data || new Date().toISOString().split('T')[0],
        tipo: initialData?.tipo || 'Folha de Pagamento',
        gratificacao_percentual: initialData?.gratificacao_percentual,
        incentivo_valor: initialData?.incentivo_valor,
        observacao: initialData?.observacao || '',
        status: initialData?.status ?? true,
    });

    const activeFuncionarios = funcionarios.filter(f => f.status === 'ativo' && f.empresa === formData.empresa);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    };

    const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const novoTipo = e.target.value as TipoGratificacao;
        setFormData(prev => ({
            ...prev,
            tipo: novoTipo,
            gratificacao_percentual: undefined,
            incentivo_valor: undefined
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.funcionario_id || !formData.data || !formData.tipo) {
            showFeedback('error', 'Preencha os campos obrigatórios.');
            return;
        }

        if (formData.tipo === 'Folha de Pagamento' && (formData.gratificacao_percentual === undefined || formData.gratificacao_percentual <= 0)) {
            showFeedback('error', 'Informe um percentual válido para gratificação em folha.');
            return;
        }

        if (formData.tipo === 'Incentivo' && (formData.incentivo_valor === undefined || formData.incentivo_valor <= 0)) {
            showFeedback('error', 'Informe um valor válido para o incentivo.');
            return;
        }

        try {
            if (initialData) {
                await update({ id: initialData.id, data: formData });
            } else {
                await create(formData);
            }
            if (onSuccess) onSuccess();
            closeModal();
            showFeedback('success', 'Registro salvo com sucesso!');
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, empresa: 'FEMOG', funcionario_id: '' }))}
                    className={`p-3 rounded-lg border text-center transition-colors ${formData.empresa === 'FEMOG'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    FEMOG
                </button>
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, empresa: 'SEMOG', funcionario_id: '' }))}
                    className={`p-3 rounded-lg border text-center transition-colors ${formData.empresa === 'SEMOG'
                        ? 'bg-orange-50 border-orange-500 text-orange-700 font-medium'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    SEMOG
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <SelectField
                    label="Funcionário"
                    name="funcionario_id"
                    value={formData.funcionario_id}
                    onChange={handleChange}
                    options={activeFuncionarios.map(func => ({ value: func.id ?? '', label: `${func.nome} (${func.cpf})` }))}
                    required
                    disabled={isLoadingFunc}
                />

                <div className="grid grid-cols-2 gap-4">
                    <InputField
                        label="Data"
                        type="date"
                        name="data"
                        value={formData.data}
                        onChange={handleChange}
                        required
                    />
                    <SelectField
                        label="Tipo"
                        name="tipo"
                        value={formData.tipo}
                        onChange={handleTipoChange}
                        options={[
                            { value: 'Folha de Pagamento', label: 'Folha de Pagamento' },
                            { value: 'Incentivo', label: 'Incentivo' }
                        ]}
                        required
                    />
                </div>

                {formData.tipo === 'Folha de Pagamento' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Percentual da Gratificação (%) *</label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                name="gratificacao_percentual"
                                value={formData.gratificacao_percentual || ''}
                                onChange={handleNumberChange}
                                className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-10"
                                placeholder="0.00"
                                required
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">%</span>
                            </div>
                        </div>
                    </div>
                )}

                {formData.tipo === 'Incentivo' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Incentivo (R$) *</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">R$</span>
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                name="incentivo_valor"
                                value={formData.incentivo_valor || ''}
                                onChange={handleNumberChange}
                                className="w-full rounded-md border-gray-300 shadow-sm p-2 pl-10 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observação (Opcional)</label>
                    <textarea
                        name="observacao"
                        value={formData.observacao}
                        onChange={handleChange}
                        rows={3}
                        className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Informações adicionais..."
                    />
                </div>

                <div className="pt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            name="status"
                            className="sr-only peer" 
                            checked={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.checked }))}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-700">
                            {formData.status ? 'Ativo (Aplicar em Benefícios)' : 'Inativo'}
                        </span>
                    </label>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancelar
                </button>
                <PrimaryButton type="submit" disabled={isCreating || isUpdating}>
                    {isCreating || isUpdating ? 'Salvando...' : 'Salvar Registro'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default GratificacaoForm;
