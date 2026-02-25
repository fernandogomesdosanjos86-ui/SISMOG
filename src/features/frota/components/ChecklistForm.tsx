import React, { useState } from 'react';
import { useChecklists } from '../hooks/useChecklists';
import { useVeiculos } from '../hooks/useVeiculos';
import type { Checklist, ChecklistFormData, ChecklistItem } from '../types';
import { CHECKLIST_ITEMS } from '../types';
import { format } from 'date-fns';
import { useModal } from '../../../context/ModalContext';
import PrimaryButton from '../../../components/PrimaryButton';

interface ChecklistFormProps {
    initialData?: Checklist;
    onSuccess?: () => void;
}

const ChecklistForm: React.FC<ChecklistFormProps> = ({ initialData, onSuccess }) => {
    const { closeModal } = useModal();
    const { createChecklist, updateChecklist, isCreating, isUpdating } = useChecklists();
    const { veiculos } = useVeiculos();

    // Filtramos apenas os veículos 'Ativos'
    const veiculosAtivos = veiculos.filter(v => v.status === 'Ativo');

    const [formData, setFormData] = useState<ChecklistFormData>(() => {
        if (initialData) {
            return {
                data: initialData.data,
                veiculo_id: initialData.veiculo_id,
                km_atual: initialData.km_atual,
                checkitens: initialData.checkitens || [],
                outros_itens: initialData.outros_itens || '',
                avaria_manutencao: initialData.avaria_manutencao,
                descricao_avaria: initialData.descricao_avaria || '',
            };
        }
        return {
            data: format(new Date(), 'yyyy-MM-dd'),
            veiculo_id: '',
            km_atual: '',
            checkitens: [],
            outros_itens: '',
            avaria_manutencao: false,
            descricao_avaria: '',
        };
    });

    const isEditMode = !!initialData;
    const isLoading = isCreating || isUpdating;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (isEditMode && initialData) {
                await updateChecklist({ id: initialData.id, data: formData });
            } else {
                await createChecklist(formData);
            }
            onSuccess?.();
        } catch (error) {
            console.error('Submit error', error);
        }
    };

    const handleCheckboxChange = (item: ChecklistItem) => {
        const currentItems = [...formData.checkitens];
        if (currentItems.includes(item)) {
            setFormData({ ...formData, checkitens: currentItems.filter(i => i !== item) });
        } else {
            setFormData({ ...formData, checkitens: [...currentItems, item] });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data
                    </label>
                    <input
                        type="date"
                        required
                        value={formData.data}
                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Veículo
                    </label>
                    <select
                        required
                        value={formData.veiculo_id}
                        onChange={(e) => setFormData({ ...formData, veiculo_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isEditMode}
                    >
                        <option value="">Selecione um veículo</option>
                        {veiculosAtivos.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.marca_modelo} ({v.placa})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        KM Atual
                    </label>
                    <input
                        type="number"
                        required
                        min="0"
                        value={formData.km_atual}
                        onChange={(e) => setFormData({ ...formData, km_atual: e.target.value ? Number(e.target.value) : '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        placeholder="Ex: 54000"
                    />
                </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Itens Inspecionados</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                    {CHECKLIST_ITEMS.map((item) => (
                        <label key={item} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.checkitens.includes(item)}
                                onChange={() => handleCheckboxChange(item)}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{item}</span>
                        </label>
                    ))}
                </div>

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Outros Itens
                    </label>
                    <textarea
                        rows={2}
                        value={formData.outros_itens}
                        onChange={(e) => setFormData({ ...formData, outros_itens: e.target.value })}
                        placeholder="Especifique outros itens ou observações..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                    />
                </div>
            </div>

            <div className={`border-t border-gray-200 pt-4 mt-4 p-4 rounded-lg transition-colors ${formData.avaria_manutencao ? 'bg-orange-50 border border-orange-200' : 'bg-white'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.avaria_manutencao}
                            onChange={(e) => setFormData({ ...formData, avaria_manutencao: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </div>
                    <div>
                        <span className="text-sm font-semibold text-gray-900 block">Registrar Avaria ou Manutenção Necessária</span>
                        <span className="text-xs text-gray-500">Marque se o veículo estiver com problema mecânico ou funilaria</span>
                    </div>
                </label>

                {formData.avaria_manutencao && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-orange-800 mb-1">
                            Descrição do Problema *
                        </label>
                        <textarea
                            required
                            rows={3}
                            value={formData.descricao_avaria}
                            onChange={(e) => setFormData({ ...formData, descricao_avaria: e.target.value })}
                            placeholder="Descreva detalhadamente a avaria encontrada..."
                            className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none bg-white text-sm"
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
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
                <PrimaryButton type="submit" disabled={isLoading}>
                    {isLoading ? 'Salvando...' : (isEditMode ? 'Salvar Alterações' : 'Lançar Checklist')}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default ChecklistForm;
