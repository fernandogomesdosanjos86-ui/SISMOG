import React, { useState } from 'react';
import { useModal } from '../../../context/ModalContext';
import { useContratoDocumentos } from '../hooks/useContratoDocumentos';
import PrimaryButton from '../../../components/PrimaryButton';
import { InputField } from '../../../components/forms/InputField';

interface DocumentoFormProps {
    contratoId: string;
    onSuccess?: () => void;
}

const DocumentoForm: React.FC<DocumentoFormProps> = ({ contratoId, onSuccess }) => {
    const { closeModal, showFeedback } = useModal();
    const { create, isCreating } = useContratoDocumentos(contratoId);
    
    const [descricao, setDescricao] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            showFeedback('error', 'Por favor, selecione um arquivo.');
            return;
        }

        try {
            await create({ file: selectedFile, descricao });
            showFeedback('success', 'Documento anexado com sucesso!');
            if (onSuccess) onSuccess();
            closeModal();
        } catch (error) {
            console.error(error);
            showFeedback('error', 'Erro ao anexar documento. Verifique o tamanho do arquivo ou tente novamente.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <InputField
                    label="Descrição do Documento"
                    name="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    required
                    placeholder="Ex: Contrato Assinado v1"
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Arquivo <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-2">Formatos permitidos: PDF, Imagens. Max: 50MB.</p>
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
                <PrimaryButton type="submit" disabled={isCreating || !selectedFile}>
                    {isCreating ? 'Enviando...' : 'Anexar Documento'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default DocumentoForm;
