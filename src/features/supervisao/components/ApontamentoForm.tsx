import React, { useState } from 'react';
import { usePostos } from '../hooks/usePostos';
import { useFuncionarios } from '../../rh/hooks/useFuncionarios';
import type { ApontamentoFormData, TipoApontamento } from '../types';

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
                <div>
                    <label className="block text-sm font-medium text-gray-700">Empresa</label>
                    <select
                        name="empresa"
                        value={formData.empresa}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        required
                    >
                        <option value="FEMOG">FEMOG</option>
                        <option value="SEMOG">SEMOG</option>
                    </select>
                </div>

                {/* Posto */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Posto de Trabalho</label>
                    <select
                        name="posto_id"
                        value={formData.posto_id}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        required
                    >
                        <option value="">Selecione...</option>
                        {filteredPostos.map(p => (
                            <option key={p.id} value={p.id}>{p.nome}</option>
                        ))}
                    </select>
                </div>

                {/* Funcionario */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Funcionário</label>
                    <select
                        name="funcionario_id"
                        value={formData.funcionario_id}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        required
                    >
                        <option value="">Selecione...</option>
                        {filteredFuncionarios.map(f => (
                            <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                    </select>
                </div>

                {/* Apontamento Tipo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Apontamento</label>
                    <select
                        name="apontamento"
                        value={formData.apontamento}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        required
                    >
                        {TIPOS_APONTAMENTO.map(tipo => (
                            <option key={tipo} value={tipo}>{tipo}</option>
                        ))}
                    </select>
                </div>

                {/* Data */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Data</label>
                    <input
                        type="date"
                        name="data"
                        value={formData.data}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        required
                    />
                </div>

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

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Salvar Lançamento
                </button>
            </div>
        </form>
    );
};

export default ApontamentoForm;
