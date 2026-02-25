import React, { useState } from 'react';
import { useModal } from '../../../context/ModalContext';
import { useFuncionarios } from '../hooks/useFuncionarios';
import type { Funcionario, FuncionarioFormData } from '../types';
import PrimaryButton from '../../../components/PrimaryButton';
import { MaskedInputField } from '../../../components/forms/MaskedInputField';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';


interface FuncionarioFormProps {
    initialData?: Funcionario;
    onSuccess?: () => void;
}

const FuncionarioForm: React.FC<FuncionarioFormProps> = ({ initialData, onSuccess }) => {
    const { closeModal, showFeedback } = useModal();
    const { create, update, isCreating, isUpdating, useCargos } = useFuncionarios();
    const { data: cargos = [] } = useCargos();

    const [formData, setFormData] = useState<FuncionarioFormData>({
        empresa: initialData?.empresa || 'FEMOG',
        nome: initialData?.nome || '',
        cpf: initialData?.cpf || '',
        cargo_id: initialData?.cargo_id || '',
        tipo_contrato: initialData?.tipo_contrato || 'Mensalista',
        banco: initialData?.banco || '',
        agencia: initialData?.agencia || '',
        conta: initialData?.conta || '',
        pix: initialData?.pix || '',
        status: initialData?.status || 'ativo',
    });

    const filteredCargos = cargos.filter(c => c.empresa === formData.empresa);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.nome || !formData.cpf || !formData.cargo_id) {
            showFeedback('error', 'Preencha os campos obrigatórios (Nome, CPF, Cargo).');
            return;
        }

        try {
            if (initialData) {
                await update({ id: initialData.id, data: formData });
                showFeedback('success', 'Funcionário atualizado com sucesso!');
            } else {
                await create(formData);
                showFeedback('success', 'Funcionário cadastrado com sucesso!');
            }
            if (onSuccess) onSuccess();
            closeModal();
        } catch (error) {
            console.error(error);
            showFeedback('error', 'Erro ao salvar funcionário.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Empresa Selection */}
            {!initialData && (
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, empresa: 'FEMOG', cargo_id: '' }))}
                        className={`p-3 rounded-lg border text-center transition-colors ${formData.empresa === 'FEMOG'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        FEMOG
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, empresa: 'SEMOG', cargo_id: '' }))}
                        className={`p-3 rounded-lg border text-center transition-colors ${formData.empresa === 'SEMOG'
                            ? 'bg-orange-50 border-orange-500 text-orange-700 font-medium'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        SEMOG
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <InputField
                        label="Nome Completo"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        required
                    />
                </div>

                <MaskedInputField
                    label="CPF"
                    mask="999.999.999-99"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    placeholder="000.000.000-00"
                    required
                />

                <SelectField
                    label="Cargo"
                    name="cargo_id"
                    value={formData.cargo_id}
                    onChange={handleChange}
                    options={filteredCargos.map(cargo => ({ value: cargo.id ?? '', label: `${cargo.cargo} - ${cargo.uf}` }))}
                    required
                />

                <SelectField
                    label="Tipo de Contrato"
                    name="tipo_contrato"
                    value={formData.tipo_contrato}
                    onChange={handleChange}
                    options={[
                        { value: 'Mensalista', label: 'Mensalista' },
                        { value: 'Intermitente', label: 'Intermitente' },
                        { value: 'Prazo Determinado', label: 'Prazo Determinado' },
                        { value: 'Prolabore', label: 'Prolabore' },
                        { value: 'Estagiário', label: 'Estagiário' },
                        { value: 'Sem Remuneração', label: 'Sem Remuneração' },
                    ]}
                />

                <SelectField
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={[
                        { value: 'ativo', label: 'Ativo' },
                        { value: 'inativo', label: 'Inativo' },
                    ]}
                />

                <div className="md:col-span-2 border-t pt-4 mt-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Dados Bancários</h4>
                </div>

                <InputField
                    label="Banco"
                    name="banco"
                    value={formData.banco}
                    onChange={handleChange}
                />

                <InputField
                    label="Agência"
                    name="agencia"
                    value={formData.agencia}
                    onChange={handleChange}
                />

                <InputField
                    label="Conta Corrente"
                    name="conta"
                    value={formData.conta}
                    onChange={handleChange}
                />

                <InputField
                    label="Chave Pix"
                    name="pix"
                    value={formData.pix}
                    onChange={handleChange}
                />
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
                    {isCreating || isUpdating ? 'Salvando...' : 'Salvar Funcionário'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default FuncionarioForm;
