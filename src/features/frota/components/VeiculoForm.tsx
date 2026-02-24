import React, { useState, useEffect } from 'react';
import { useVeiculos } from '../hooks/useVeiculos';
import type { Veiculo, VeiculoFormData } from '../types';

interface VeiculoFormProps {
    initialData?: Veiculo;
    onSuccess?: () => void;
}

const VeiculoForm: React.FC<VeiculoFormProps> = ({ initialData, onSuccess }) => {
    const { createVeiculo, updateVeiculo, isCreating, isUpdating } = useVeiculos();

    const [formData, setFormData] = useState<VeiculoFormData>({
        marca_modelo: '',
        placa: '',
        tipo: 'Combustão',
        abastecimento: false,
        capacidade_bateria: undefined,
        status: 'Ativo'
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                marca_modelo: initialData.marca_modelo,
                placa: initialData.placa,
                tipo: initialData.tipo,
                abastecimento: initialData.abastecimento,
                capacidade_bateria: initialData.capacidade_bateria,
                status: initialData.status
            });
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = { ...formData };
        if (payload.tipo !== 'Elétrico') {
            payload.capacidade_bateria = undefined; // Clean up when combustão
        }

        try {
            if (initialData) {
                await updateVeiculo({ id: initialData.id, data: payload });
            } else {
                await createVeiculo(payload);
            }
            onSuccess?.();
        } catch (error) {
            console.error('Erro ao salvar veículo:', error);
        }
    };

    const isLoading = isCreating || isUpdating;

    const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        // Limitar a 7 caracteres no máximo
        const truncated = value.slice(0, 7);
        // Opcionalmente formatar ABC-1234 ou ABC1D23. Vamos deixar apenas uppercase
        setFormData({ ...formData, placa: truncated });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Marca / Modelo *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.marca_modelo}
                        onChange={(e) => setFormData({ ...formData, marca_modelo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Fiat / Strada Working 1.4"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Placa *
                    </label>
                    <input
                        type="text"
                        required
                        maxLength={7}
                        value={formData.placa}
                        onChange={handlePlacaChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                        placeholder="ABC1234"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo *
                    </label>
                    <select
                        required
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'Combustão' | 'Elétrico' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="Combustão">Combustão</option>
                        <option value="Elétrico">Elétrico</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status *
                    </label>
                    <select
                        required
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Ativo' | 'Em Manutenção' | 'Inativo' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="Ativo">Ativo</option>
                        <option value="Em Manutenção">Em Manutenção</option>
                        <option value="Inativo">Inativo</option>
                    </select>
                </div>

                {formData.tipo === 'Elétrico' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Capacidade Bateria (kWh)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            required
                            value={formData.capacidade_bateria || ''}
                            onChange={(e) => setFormData({ ...formData, capacidade_bateria: e.target.value ? Number(e.target.value) : undefined })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: 50.5"
                        />
                    </div>
                )}

                <div className="flex items-center pt-6">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.abastecimento}
                            onChange={(e) => setFormData({ ...formData, abastecimento: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-700">Habilitado para Abastecimento</span>
                    </label>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {isLoading ? 'Salvando...' : initialData ? 'Atualizar Veículo' : 'Cadastrar Veículo'}
                </button>
            </div>
        </form>
    );
};

export default VeiculoForm;
