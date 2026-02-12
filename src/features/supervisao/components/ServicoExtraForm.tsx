import React, { useState, useEffect } from 'react';
import { usePostos } from '../hooks/usePostos';
import { useFuncionarios } from '../../rh/hooks/useFuncionarios';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../services/supabase';
import type { ServicoExtraFormData } from '../types';
import { servicosExtrasService } from '../../../services/servicosExtrasService';

interface ServicoExtraFormProps {
    onSuccess: () => void;
    initialData?: any; // Using any for simplicity in mapping back to form data, strict type ideally
    create: (data: ServicoExtraFormData) => Promise<any>;
    update: (id: string, data: ServicoExtraFormData) => Promise<any>;
}

const ServicoExtraForm: React.FC<ServicoExtraFormProps> = ({ onSuccess, initialData, create, update }) => {
    const { postos } = usePostos();
    const { funcionarios } = useFuncionarios();

    // Form State
    const [formData, setFormData] = useState<ServicoExtraFormData>({
        empresa: initialData?.empresa || 'FEMOG',
        posto_id: initialData?.posto_id || '',
        funcionario_id: initialData?.funcionario_id || '',
        cargo_id: initialData?.cargo_id || '',
        turno: initialData?.turno || 'Diurno', // Default
        entrada: initialData?.entrada || '',
        saida: initialData?.saida || ''
    });

    // Fetched Data for Calcs
    const [cargos, setCargos] = useState<any[]>([]);
    const [calculatedValues, setCalculatedValues] = useState({
        duracao: 0,
        valorHora: 0,
        total: 0
    });

    // Fetch Cargos
    useEffect(() => {
        const fetchCargos = async () => {
            if (!formData.empresa) return;
            const { data } = await supabase
                .from('cargos_salarios')
                .select('*')
                .eq('empresa', formData.empresa)
                .order('cargo');
            setCargos(data || []);
        };
        fetchCargos();
    }, [formData.empresa]);

    // Filtered Lists
    const filteredPostos = postos.filter(p => p.empresa === formData.empresa && p.status === 'ativo');
    const filteredFuncionarios = funcionarios.filter(f => f.empresa === formData.empresa && f.status === 'ativo')
        .sort((a, b) => a.nome.localeCompare(b.nome));

    // Calculations
    useEffect(() => {
        const calculate = async () => {
            if (formData.cargo_id && formData.entrada && formData.saida) {
                const entrada = new Date(formData.entrada);
                const saida = new Date(formData.saida);

                if (saida > entrada) {
                    // Duration
                    const diffMs = saida.getTime() - entrada.getTime();
                    const duration = diffMs / (1000 * 60 * 60);

                    // Rate
                    const cargo = cargos.find(c => c.id === formData.cargo_id);
                    const rate = formData.turno === 'Diurno' ? (cargo?.valor_he_diurno || 0) : (cargo?.valor_he_noturno || 0);

                    // Value
                    let rawValue = duration * rate;
                    let total = rawValue;
                    if ((rawValue % 1) >= 0.96) {
                        total = Math.ceil(rawValue);
                    } else {
                        total = Math.floor(rawValue * 100) / 100;
                    }

                    setCalculatedValues({
                        duracao: Number(duration.toFixed(2)),
                        valorHora: Number(rate),
                        total: total
                    });
                }
            }
        };
        calculate();
    }, [formData.cargo_id, formData.entrada, formData.saida, formData.turno, cargos]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Reset dependent fields if company changes
        if (name === 'empresa') {
            setFormData(prev => ({ ...prev, empresa: value as any, posto_id: '', funcionario_id: '', cargo_id: '' }));
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

                {/* Cargo */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Cargo (Base para cálculo)</label>
                    <select
                        name="cargo_id"
                        value={formData.cargo_id}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        required
                    >
                        <option value="">Selecione...</option>
                        {cargos.map(c => (
                            <option key={c.id} value={c.id}>{c.cargo} - {c.uf}</option>
                        ))}
                    </select>
                </div>

                {/* Turno */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Turno</label>
                    <select
                        name="turno"
                        value={formData.turno}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        required
                    >
                        <option value="Diurno">Diurno</option>
                        <option value="Noturno">Noturno</option>
                    </select>
                </div>

                {/* Datas */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Entrada</label>
                    <input
                        type="datetime-local"
                        name="entrada"
                        value={formData.entrada}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Saída</label>
                    <input
                        type="datetime-local"
                        name="saida"
                        value={formData.saida}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        required
                    />
                </div>
            </div>

            {/* Resumo Calculado */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Resumo do Serviço</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <span className="block text-xs text-gray-500">Duração</span>
                        <span className="font-bold text-gray-900">{calculatedValues.duracao.toFixed(2)}h</span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-500">Valor/Hora</span>
                        <span className="font-bold text-gray-900">R$ {calculatedValues.valorHora.toFixed(2)}</span>
                    </div>
                    <div>
                        <span className="block text-xs text-gray-500">Total</span>
                        <span className="font-bold text-blue-600 text-lg">R$ {calculatedValues.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
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

export default ServicoExtraForm;
