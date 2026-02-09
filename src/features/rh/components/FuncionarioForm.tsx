import React, { useState } from 'react';
import { useModal } from '../../../context/ModalContext';
import { useFuncionarios } from '../hooks/useFuncionarios';
import type { Funcionario, FuncionarioFormData } from '../types';


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


    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '') // Remove non-digits
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1'); // Limit to 11 digits formatted
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'cpf') {
            setFormData(prev => ({ ...prev, [name]: formatCPF(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
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
                    <label className="block text-sm font-medium text-gray-700">Nome Completo *</label>
                    <input
                        type="text"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">CPF *</label>
                    <input
                        type="text"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleChange}
                        maxLength={14}
                        placeholder="000.000.000-00"
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Cargo *</label>
                    <select
                        name="cargo_id"
                        value={formData.cargo_id}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        required
                    >
                        <option value="">Selecione um cargo</option>
                        {filteredCargos.map(cargo => (
                            <option key={cargo.id} value={cargo.id}>
                                {cargo.cargo} - {cargo.uf}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Contrato</label>
                    <select
                        name="tipo_contrato"
                        value={formData.tipo_contrato}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="Mensalista">Mensalista</option>
                        <option value="Intermitente">Intermitente</option>
                        <option value="Prazo Determinado">Prazo Determinado</option>
                        <option value="Prolabore">Prolabore</option>
                        <option value="Estagiário">Estagiário</option>
                        <option value="Sem Remuneração">Sem Remuneração</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                    </select>
                </div>

                <div className="md:col-span-2 border-t pt-4 mt-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Dados Bancários</h4>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Banco</label>
                    <input
                        type="text"
                        name="banco"
                        value={formData.banco}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Agência</label>
                    <input
                        type="text"
                        name="agencia"
                        value={formData.agencia}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Conta Corrente</label>
                    <input
                        type="text"
                        name="conta"
                        value={formData.conta}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Chave Pix</label>
                    <input
                        type="text"
                        name="pix"
                        value={formData.pix}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4 gap-3 border-t">
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isCreating || isUpdating}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                >
                    {isCreating || isUpdating ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Salvando...
                        </>
                    ) : (
                        'Salvar'
                    )}
                </button>
            </div>
        </form>
    );
};

export default FuncionarioForm;
