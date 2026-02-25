import React, { useState } from 'react';
import { useModal } from '../../../context/ModalContext';
import { usePostos } from '../hooks/usePostos';
import type { PostoTrabalho, PostoFormData } from '../types';
import PrimaryButton from '../../../components/PrimaryButton';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';

interface PostoFormProps {
    initialData?: PostoTrabalho;
    onSuccess?: () => void;
}

const PostoForm: React.FC<PostoFormProps> = ({ initialData, onSuccess }) => {
    const { closeModal, showFeedback } = useModal();
    const { create, update, isCreating, isUpdating } = usePostos();

    const [formData, setFormData] = useState<PostoFormData>({
        empresa: initialData?.empresa || 'FEMOG',
        nome: initialData?.nome || '',
        status: initialData?.status || 'ativo',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nome) {
            showFeedback('error', 'O nome do posto é obrigatório.');
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
        } catch (error) {
            // Error handling already in hook
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {!initialData && (
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, empresa: 'FEMOG' }))}
                        className={`p-3 rounded-lg border text-center transition-colors ${formData.empresa === 'FEMOG'
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        FEMOG
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, empresa: 'SEMOG' }))}
                        className={`p-3 rounded-lg border text-center transition-colors ${formData.empresa === 'SEMOG'
                            ? 'bg-orange-50 border-orange-500 text-orange-700 font-medium'
                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        SEMOG
                    </button>
                </div>
            )}

            <InputField
                label="Nome do Posto"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: Portaria Central"
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

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancelar
                </button>
                <PrimaryButton type="submit" disabled={isCreating || isUpdating}>
                    {isCreating || isUpdating ? 'Salvando...' : 'Salvar'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default PostoForm;
