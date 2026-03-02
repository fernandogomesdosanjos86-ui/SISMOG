import React, { useState, useEffect } from 'react';
import { useMovimentacoes } from '../hooks/useMovimentacoes';
import { useVeiculos } from '../hooks/useVeiculos';
import type { Movimentacao, MovimentacaoFormData, Veiculo } from '../types';
import PrimaryButton from '../../../components/PrimaryButton';
import { useModal } from '../../../context/ModalContext';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';

interface MovimentacaoFormProps {
    initialData?: Movimentacao;
    onSuccess?: () => void;
}

const MovimentacaoForm: React.FC<MovimentacaoFormProps> = ({ initialData, onSuccess }) => {
    const { create, update, isCreating, isUpdating } = useMovimentacoes();
    const { veiculos } = useVeiculos();
    const { closeModal, showFeedback } = useModal();

    const veiculosAtivos = veiculos.filter(v => v.status === 'Ativo' || v.id === initialData?.veiculo_id);

    const formatToDatetimeLocal = (dateString?: string) => {
        if (!dateString) return '';
        // "2023-10-27T14:30:00Z" -> "2023-10-27T11:30" (ajustando pro local timezone se necessario)
        // Simplificação: vamos retirar o Z e usar direto no input se vier do banco.
        const dt = new Date(dateString);
        if (isNaN(dt.getTime())) return '';
        const offset = dt.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(dt.getTime() - offset)).toISOString().slice(0, 16);
        return localISOTime;
    };

    const formatDateForDB = (datetimeLocal: string) => {
        if (!datetimeLocal) return '';
        return new Date(datetimeLocal).toISOString();
    };


    const [formData, setFormData] = useState<MovimentacaoFormData>({
        data_hora_inicial: initialData?.data_hora_inicial ? formatToDatetimeLocal(initialData.data_hora_inicial) : '',
        data_hora_final: initialData?.data_hora_final ? formatToDatetimeLocal(initialData.data_hora_final) : '',
        veiculo_id: initialData?.veiculo_id || '',
        trajeto: initialData?.trajeto || '',
        km_inicial: initialData?.km_inicial || '',
        km_final: initialData?.km_final || '',
        bateria_inicial: initialData?.bateria_inicial || '',
        bateria_final: initialData?.bateria_final || '',
    });

    const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);

    useEffect(() => {
        if (formData.veiculo_id) {
            const v = veiculosAtivos.find(v => v.id === formData.veiculo_id);
            setSelectedVeiculo(v || null);

            // se trocar de veículo e for combustão, limpa energia
            if (v?.tipo === 'Combustão') {
                setFormData(prev => ({ ...prev, bateria_inicial: '', bateria_final: '' }));
            }
        } else {
            setSelectedVeiculo(null);
        }
    }, [formData.veiculo_id, veiculosAtivos]);


    const isEletrico = selectedVeiculo?.tipo === 'Elétrico';


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validações
        if (new Date(formData.data_hora_final) <= new Date(formData.data_hora_inicial)) {
            showFeedback('error', 'A data final deve ser maior que a inicial.');
            return;
        }

        if (Number(formData.km_final) <= Number(formData.km_inicial)) {
            showFeedback('error', 'O KM final deve ser maior que o KM inicial.');
            return;
        }

        if (isEletrico) {
            if (Number(formData.bateria_final) > Number(formData.bateria_inicial)) {
                showFeedback('error', 'A bateria final não pode ser maior que a bateria inicial.');
                return;
            }
        }


        try {
            const payload = {
                ...formData,
                data_hora_inicial: formatDateForDB(formData.data_hora_inicial),
                data_hora_final: formatDateForDB(formData.data_hora_final),
                km_inicial: Number(formData.km_inicial),
                km_final: Number(formData.km_final),
                bateria_inicial: formData.bateria_inicial !== '' ? Number(formData.bateria_inicial) : undefined,
                bateria_final: formData.bateria_final !== '' ? Number(formData.bateria_final) : undefined,
            };

            if (initialData) {
                await update({
                    id: initialData.id,
                    data: payload,
                    veiculoTipo: selectedVeiculo?.tipo || 'Combustão',
                    veiculoCapacidadeBateria: selectedVeiculo?.capacidade_bateria
                });
                showFeedback('success', 'Movimentação atualizada com sucesso!');
            } else {
                await create({
                    data: payload,
                    veiculoTipo: selectedVeiculo?.tipo || 'Combustão',
                    veiculoCapacidadeBateria: selectedVeiculo?.capacidade_bateria
                });
                showFeedback('success', 'Movimentação registrada com sucesso!');
            }
            if (onSuccess) onSuccess();
            closeModal();
        } catch (error) {
            console.error('Erro ao salvar movimentação:', error);
            showFeedback('error', 'Erro ao salvar movimentação.');
        }
    };


    const kmRodadosInfo = (formData.km_final !== '' && formData.km_inicial !== '' && Number(formData.km_final) >= Number(formData.km_inicial))
        ? Number(formData.km_final) - Number(formData.km_inicial)
        : 0;

    const bateriaConsumidaInfo = (formData.bateria_final !== '' && formData.bateria_inicial !== '' && Number(formData.bateria_inicial) >= Number(formData.bateria_final))
        ? Number(formData.bateria_inicial) - Number(formData.bateria_final)
        : 0;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                    label="Veículo"
                    required
                    value={formData.veiculo_id}
                    onChange={e => setFormData({ ...formData, veiculo_id: e.target.value })}
                    disabled={!!initialData}
                    options={veiculosAtivos.map(v => ({ value: v.id, label: `${v.marca_modelo} (${v.placa}) - ${v.tipo}` }))}
                />

                <InputField
                    label="Trajeto / Destino"
                    required
                    placeholder="Ex: Base -> Cliente -> Base"
                    value={formData.trajeto}
                    onChange={e => setFormData({ ...formData, trajeto: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                    label="Início (Data/Hora)"
                    type="datetime-local"
                    required
                    value={formData.data_hora_inicial}
                    onChange={e => setFormData({ ...formData, data_hora_inicial: e.target.value })}
                />
                <InputField
                    label="Final (Data/Hora)"
                    type="datetime-local"
                    required
                    value={formData.data_hora_final}
                    onChange={e => setFormData({ ...formData, data_hora_final: e.target.value })}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <InputField
                    label="KM Inicial"
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    placeholder="0.0"
                    value={formData.km_inicial}
                    onChange={e => setFormData({ ...formData, km_inicial: e.target.value === '' ? '' : Number(e.target.value) })}
                />
                <InputField
                    label="KM Final"
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    placeholder="0.0"
                    value={formData.km_final}
                    onChange={e => setFormData({ ...formData, km_final: e.target.value === '' ? '' : Number(e.target.value) })}
                />
                <div className="md:col-span-2 pt-2 text-sm text-gray-500 flex justify-end">
                    Odômetro apurado: <strong className="ml-1 text-blue-600">{kmRodadosInfo} km</strong>
                </div>
            </div>

            {isEletrico && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50 p-4 rounded-lg border border-green-100">
                    <div className="md:col-span-2 text-sm text-green-800 font-medium mb-1">
                        Controle Energético (Veículo Elétrico)
                    </div>
                    <InputField
                        label="Bateria Inicial (%)"
                        type="number"
                        min="0"
                        max="100"
                        required
                        placeholder="100"
                        value={formData.bateria_inicial}
                        onChange={e => setFormData({ ...formData, bateria_inicial: e.target.value === '' ? '' : Number(e.target.value) })}
                    />
                    <InputField
                        label="Bateria Final (%)"
                        type="number"
                        min="0"
                        max="100"
                        required
                        placeholder="80"
                        value={formData.bateria_final}
                        onChange={e => setFormData({ ...formData, bateria_final: e.target.value === '' ? '' : Number(e.target.value) })}
                    />
                    <div className="md:col-span-2 pt-2 text-sm text-gray-500 flex justify-end">
                        Bateria consumida: <strong className="ml-1 text-green-600">{bateriaConsumidaInfo}%</strong>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                    type="button"
                    onClick={() => {
                        if (onSuccess) onSuccess();
                        else closeModal();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancelar
                </button>
                <PrimaryButton type="submit" disabled={isCreating || isUpdating}>
                    {isCreating || isUpdating ? 'Salvando...' : 'Salvar Movimentação'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default MovimentacaoForm;
