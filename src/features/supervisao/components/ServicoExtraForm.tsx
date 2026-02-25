import React, { useState, useEffect } from 'react';
import { usePostos } from '../hooks/usePostos';
import { useFuncionarios } from '../../rh/hooks/useFuncionarios';
import { supabase } from '../../../services/supabase';
import type { ServicoExtraFormData } from '../types';
import PrimaryButton from '../../../components/PrimaryButton';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';

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

                    // Value (with robust floating point rounding)
                    const roundedValue = Math.round(duration * rate * 100) / 100;
                    const cents = Math.round((roundedValue % 1) * 100) / 100;
                    const total = cents >= 0.96 ? Math.ceil(roundedValue) : roundedValue;

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
                    label="Cargo (Base para cálculo)"
                    name="cargo_id"
                    value={formData.cargo_id}
                    onChange={handleChange}
                    options={cargos.map(c => ({ value: c.id ?? '', label: `${c.cargo} - ${c.uf}` }))}
                    required
                />

                {/* Turno */}
                <SelectField
                    label="Turno"
                    name="turno"
                    value={formData.turno}
                    onChange={handleChange}
                    options={[
                        { value: 'Diurno', label: 'Diurno' },
                        { value: 'Noturno', label: 'Noturno' }
                    ]}
                    required
                />

                {/* Datas */}
                <InputField
                    label="Entrada"
                    type="datetime-local"
                    name="entrada"
                    value={formData.entrada}
                    onChange={handleChange}
                    required
                />
                <InputField
                    label="Saída"
                    type="datetime-local"
                    name="saida"
                    value={formData.saida}
                    onChange={handleChange}
                    required
                />
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

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
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

export default ServicoExtraForm;
