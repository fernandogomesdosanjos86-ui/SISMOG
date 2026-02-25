import React, { useState } from 'react';
import { usePostos } from '../hooks/usePostos';
import { useFuncionarios } from '../../rh/hooks/useFuncionarios';
import type { ApontamentoFormData, TipoApontamento } from '../types';
import PrimaryButton from '../../../components/PrimaryButton';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';

interface ApontamentoFormProps {
    onSuccess: () => void;
    initialData?: any;
    create: (data: ApontamentoFormData) => Promise<any>;
    update: (id: string, data: Partial<ApontamentoFormData>) => Promise<any>;
}

const TIPOS_APONTAMENTO: TipoApontamento[] = [
    'Abono',
    'Ausência',
    'Atestado',
    'Curso',
    'Penalidade',
    'Troca Presença',
    'Troca Ausência'
];

const ApontamentoForm: React.FC<ApontamentoFormProps> = ({ onSuccess, initialData, create, update }) => {
    const { postos } = usePostos();
    const { funcionarios } = useFuncionarios();

    const [formData, setFormData] = useState<ApontamentoFormData>({
        empresa: initialData?.empresa || 'FEMOG',
        posto_id: initialData?.posto_id || '',
        funcionario_id: initialData?.funcionario_id || '',
        apontamento: initialData?.apontamento || 'Abono',
        data: initialData?.data || new Date().toISOString().split('T')[0],
        observacao: initialData?.observacao || ''
    });

    const filteredPostos = postos.filter(p => p.empresa === formData.empresa && p.status === 'ativo');
    const filteredFuncionarios = funcionarios.filter(f => f.empresa === formData.empresa && f.status === 'ativo')
        .sort((a, b) => a.nome.localeCompare(b.nome));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as any }));

        if (name === 'empresa') {
            setFormData(prev => ({ ...prev, empresa: value as any, posto_id: '', funcionario_id: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (initialData?.id) {
                await update(initialData.id, formData);
            } else {
                await create(formData);
            }
            onSuccess();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Empresa */}
                <SelectField
                    label="Empresa"
                    name="empresa"
                    value={formData.empresa}
                    onChange={handleChange}
                    options={[
                        { value: 'FEMOG', label: 'FEMOG' },
                        { value: 'SEMOG', label: 'SEMOG' }
                    ]}
                    required
                />

                <SelectField
                    label="Posto de Trabalho"
                    name="posto_id"
                    value={formData.posto_id}
                    onChange={handleChange}
                    options={filteredPostos.map(p => ({ value: p.id ?? '', label: p.nome }))}
                    required
                />

                <div className="md:col-span-2">
                    <SelectField
                        label="Funcionário"
                        name="funcionario_id"
                        value={formData.funcionario_id}
                        onChange={handleChange}
                        options={filteredFuncionarios.map(f => ({ value: f.id ?? '', label: f.nome }))}
                        required
                    />
                </div>

                <SelectField
                    label="Tipo de Apontamento"
                    name="apontamento"
                    value={formData.apontamento}
                    onChange={handleChange}
                    options={TIPOS_APONTAMENTO.map(tipo => ({ value: tipo, label: tipo }))}
                    required
                />

                <InputField
                    label="Data"
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleChange}
                    required
                />

                {/* Observacao */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Observação (Opcional)</label>
                    <textarea
                        name="observacao"
                        value={formData.observacao}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        placeholder="Detalhes adicionais..."
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button
                    type="button"
                    onClick={onSuccess}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancelar
                </button>
                <PrimaryButton type="submit">
                    Salvar Lançamento
                </PrimaryButton>
            </div>
        </form>
    );
};

export default ApontamentoForm;
