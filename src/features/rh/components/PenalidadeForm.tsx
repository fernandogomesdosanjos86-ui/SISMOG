import React, { useState, useRef } from 'react';
import { useModal } from '../../../context/ModalContext';
import { useFuncionarios } from '../hooks/useFuncionarios';
import { usePenalidades } from '../hooks/usePenalidades';
import type { Penalidade, PenalidadeFormData } from '../types';
import { UploadCloud, X, FileText } from 'lucide-react';

interface PenalidadeFormProps {
    initialData?: Penalidade;
    onSuccess?: () => void;
}

const PenalidadeForm: React.FC<PenalidadeFormProps> = ({ initialData, onSuccess }) => {
    const { closeModal, showFeedback } = useModal();
    const { createPenalidade, updatePenalidade, isCreating, isUpdating } = usePenalidades();
    const { funcionarios, isLoading: isLoadingFunc } = useFuncionarios();

    const [formData, setFormData] = useState<PenalidadeFormData>({
        empresa: initialData?.empresa || 'FEMOG',
        funcionario_id: initialData?.funcionario_id || '',
        data: initialData?.data || new Date().toISOString().split('T')[0],
        penalidade: initialData?.penalidade || 'Advertência Verbal',
        descricao: initialData?.descricao || '',
        arquivo_url: initialData?.arquivo_url || '',
    });

    const [file, setFile] = useState<File | null>(null);
    const [fileRemoved, setFileRemoved] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeFuncionarios = funcionarios.filter(f => f.status === 'ativo' && f.empresa === formData.empresa);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setFileRemoved(false);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setFileRemoved(true);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.funcionario_id || !formData.data || !formData.penalidade) {
            showFeedback('error', 'Preencha os campos obrigatórios.');
            return;
        }

        try {
            if (initialData) {
                // If fileRemoved is true, pass null specifically. Otherwise pass the new file or undefined to leave it alone.
                let fileToUpload = fileRemoved ? null : (file ? file : undefined);

                await updatePenalidade({
                    id: initialData.id,
                    data: formData,
                    file: fileToUpload,
                    existingFileUrl: initialData.arquivo_url
                });
            } else {
                await createPenalidade({ data: formData, file });
            }
            if (onSuccess) onSuccess();
            closeModal();
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
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário *</label>
                    <select
                        name="funcionario_id"
                        value={formData.funcionario_id}
                        onChange={handleChange}
                        className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        required
                        disabled={isLoadingFunc}
                    >
                        <option value="">Selecione um funcionário</option>
                        {activeFuncionarios.map(func => (
                            <option key={func.id} value={func.id}>
                                {func.nome} ({func.cpf})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                        <input
                            type="date"
                            name="data"
                            value={formData.data}
                            onChange={handleChange}
                            className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Penalidade *</label>
                        <select
                            name="penalidade"
                            value={formData.penalidade}
                            onChange={handleChange}
                            className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-red-500 focus:ring-1 focus:ring-red-500"
                            required
                        >
                            <option value="Advertência Verbal">Advertência Verbal</option>
                            <option value="Advertência Escrita">Advertência Escrita</option>
                            <option value="Suspensão">Suspensão</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Motivo</label>
                    <textarea
                        name="descricao"
                        value={formData.descricao}
                        onChange={handleChange}
                        rows={3}
                        className="w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        placeholder="Descreva o motivo da penalidade..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comprovante Digitalizado (Opcional)</label>

                    {/* Existing file preview */}
                    {!fileRemoved && formData.arquivo_url && !file && (
                        <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 mb-3">
                            <div className="flex items-center text-sm text-gray-600 truncate">
                                <FileText className="w-4 h-4 mr-2" />
                                <span className="truncate">Arquivo salvo anteriormente</span>
                            </div>
                            <div className="flex gap-2">
                                <a href={formData.arquivo_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm font-medium">Ver</a>
                                <button type="button" onClick={handleRemoveFile} className="text-red-500 hover:text-red-700">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* New file preview */}
                    {file && (
                        <div className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50 mb-3">
                            <div className="flex items-center text-sm text-red-700 truncate">
                                <FileText className="w-4 h-4 mr-2" />
                                <span className="truncate">{file.name}</span>
                            </div>
                            <button type="button" onClick={handleRemoveFile} className="text-red-500 hover:text-red-700">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* File Input */}
                    {(!initialData?.arquivo_url || fileRemoved || !file) && !file && (
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="space-y-1 text-center">
                                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600 justify-center">
                                    <label
                                        htmlFor="file-upload"
                                        className="relative cursor-pointer bg-white rounded-md font-medium text-red-600 hover:text-red-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500"
                                    >
                                        <span>Fazer upload de arquivo</span>
                                        <input
                                            id="file-upload"
                                            name="file-upload"
                                            type="file"
                                            className="sr-only"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500">PDF, PNG, JPG até 5MB</p>
                            </div>
                        </div>
                    )}
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
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
                >
                    {isCreating || isUpdating ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Salvando...
                        </>
                    ) : (
                        'Registrar Penalidade'
                    )}
                </button>
            </div>
        </form>
    );
};

export default PenalidadeForm;
