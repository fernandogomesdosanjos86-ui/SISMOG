import React, { useState } from 'react';
import { useModal } from '../../../../context/ModalContext';
import type { Produto, ProdutoFormData } from '../types';

interface ProdutoFormProps {
    initialData?: Produto;
    onSuccess: () => void;
    create: (data: ProdutoFormData) => Promise<any>;
    update: (args: { id: string; data: ProdutoFormData }) => Promise<any>;
}

const ProdutoForm: React.FC<ProdutoFormProps> = ({ initialData, onSuccess, create, update }) => {
    const { closeModal, showFeedback } = useModal();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<ProdutoFormData>({
        tipo: initialData?.tipo || 'Individual',
        cor: initialData?.cor || '',
        tamanho: initialData?.tamanho || '',
        produto: initialData?.produto || '',
    });

    const generatedCode = [formData.produto, formData.cor, formData.tamanho].filter(Boolean).join(' ').toUpperCase().trim().replace(/\s+/g, ' ');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (initialData) {
                await update({ id: initialData.id, data: formData });
            } else {
                await create(formData);
            }
            onSuccess();
            closeModal();
        } catch (error: any) {
            showFeedback('error', error.message || 'Erro ao salvar produto.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Produto</label>
                    <select
                        name="tipo"
                        value={formData.tipo}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500"
                        required
                    >
                        <option value="Individual">Individual</option>
                        <option value="Coletivo">Coletivo</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Produto</label>
                    <input
                        type="text"
                        name="produto"
                        value={formData.produto}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500"
                        placeholder="Ex: Camisa Vigilante"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cor <span className="text-gray-400 text-xs">(opcional)</span></label>
                    <input
                        type="text"
                        name="cor"
                        value={formData.cor}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500"
                        placeholder="Ex: Branca"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tamanho <span className="text-gray-400 text-xs">(opcional)</span></label>
                    <input
                        type="text"
                        name="tamanho"
                        value={formData.tamanho}
                        onChange={handleChange}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500"
                        placeholder="Ex: G"
                    />
                </div>
            </div>

            {/* Generated Code Preview */}
            {formData.produto && (
                <div className="bg-gray-50 p-3 rounded-lg border">
                    <p className="text-xs text-gray-500 uppercase mb-1">Código Gerado</p>
                    <p className="text-sm font-bold text-gray-900">{generatedCode}</p>
                </div>
            )}

            <div className="flex justify-end pt-4 gap-3 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
        </form>
    );
};

export default ProdutoForm;
