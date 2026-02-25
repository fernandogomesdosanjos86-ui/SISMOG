import React, { useState } from 'react';
import { useModal } from '../../../../context/ModalContext';
import { useCurriculos } from '../hooks/useCurriculos';
import PrimaryButton from '../../../../components/PrimaryButton';
import { InputField } from '../../../../components/forms/InputField';
import { SelectField } from '../../../../components/forms/SelectField';
import type { Curriculo, CurriculoFormData } from '../types';

interface CurriculoFormProps {
    initialData?: Curriculo;
    onSuccess?: () => void;
}

const CurriculoForm = ({ initialData, onSuccess }: CurriculoFormProps) => {
    const { closeModal, showFeedback } = useModal();
    const { create, update, isCreating, isUpdating } = useCurriculos();

    const [formData, setFormData] = useState<CurriculoFormData>({
        empresa: initialData?.empresa || 'FEMOG',
        data: initialData?.data || new Date().toISOString().split('T')[0],
        nome: initialData?.nome || '',
        cargo: initialData?.cargo || '',
        indicacao: initialData?.indicacao || '',
        observacoes: initialData?.observacoes || '',
        status: initialData?.status || 'Pendente',
        arquivo: null
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (initialData) {
                await update({ id: initialData.id, data: formData });
            } else {
                await create(formData);
            }
            showFeedback('success', initialData ? 'Currículo atualizado!' : 'Currículo salvo!');
            if (onSuccess) onSuccess();
            closeModal();
        } catch (error: any) {
            console.error('Save error', error);
            showFeedback('error', `Erro ao salvar: ${error.message || 'Desconhecido'}`);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFormData({ ...formData, arquivo: e.target.files[0] });
        } else {
            setFormData({ ...formData, arquivo: null });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <InputField
                    label="Nome do Candidato"
                    name="nome"
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    required
                />

                <InputField
                    label="Data de Cadastro"
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={e => setFormData({ ...formData, data: e.target.value })}
                    required
                />

                <InputField
                    label="Cargo"
                    name="cargo"
                    value={formData.cargo}
                    onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                    required
                />

                <InputField
                    label="Indicação (Opcional)"
                    name="indicacao"
                    value={formData.indicacao}
                    onChange={e => setFormData({ ...formData, indicacao: e.target.value })}
                />

                <SelectField
                    label="Empresa Requisitante"
                    name="empresa"
                    value={formData.empresa}
                    onChange={e => setFormData({ ...formData, empresa: e.target.value as any })}
                    options={[
                        { value: 'FEMOG', label: 'FEMOG' },
                        { value: 'SEMOG', label: 'SEMOG' }
                    ]}
                    required
                />

                <SelectField
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    options={[
                        { value: 'Pendente', label: 'Pendente' },
                        { value: 'Aprovado', label: 'Aprovado' },
                        { value: 'Reprovado', label: 'Reprovado' },
                        { value: 'Contratado', label: 'Contratado' },
                    ]}
                    required
                />

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Observações
                    </label>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        value={formData.observacoes}
                        onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Anexo do Currículo (PDF/Imagem) {!initialData && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        required={!initialData} // only required if creating new
                    />
                    {initialData?.arquivo_url && !formData.arquivo && (
                        <p className="text-xs text-gray-500 mt-2">
                            Mantenha vazio para manter o arquivo atual.
                        </p>
                    )}
                </div>

            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Cancelar
                </button>
                <PrimaryButton type="submit" disabled={isCreating || isUpdating}>
                    {isCreating || isUpdating ? 'Salvando...' : 'Salvar'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default CurriculoForm;
