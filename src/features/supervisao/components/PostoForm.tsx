import React, { useState } from 'react';
import { useModal } from '../../../context/ModalContext';
import { usePostos } from '../hooks/usePostos';
import type { PostoTrabalho, PostoFormData } from '../types';

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

            <div>
                <label className="block text-sm font-medium text-gray-700">Nome do Posto</label>
                <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Ex: Portaria Central"
                    required
                />
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

export default PostoForm;
