import React, { useState, useEffect } from 'react';
import { useFuncionarios } from '../../rh/hooks/useFuncionarios';
import PrimaryButton from '../../../components/PrimaryButton';
import { useModal } from '../../../context/ModalContext';
import { SelectField } from '../../../components/forms/SelectField';
import { InputField } from '../../../components/forms/InputField';
import type { BancoHorasFormData, TipoBancoHoras, BancoHoras } from '../types';

export const parseHHmmToMinutesHelper = (timeString: string) => {
    const match = timeString.match(/^(-?)(\d{1,3}):(\d{2})$/);
    if (!match) return 0;
    const [_, sign, h, m] = match;
    const total = parseInt(h, 10) * 60 + parseInt(m, 10);
    return sign === '-' ? -total : total;
};

export const formatMinutesToHHmmHelper = (minutes: number) => {
    const isNegative = minutes < 0;
    const absMinutes = Math.abs(minutes);
    const h = Math.floor(absMinutes / 60);
    const m = absMinutes % 60;
    const sign = isNegative ? '-' : '';
    return `${sign}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

interface BancoHorasFormProps {
    initialData?: BancoHoras;
    onSuccess: () => void;
    create: (data: BancoHorasFormData) => Promise<any>;
    update: (id: string, data: Partial<BancoHorasFormData>) => Promise<any>;
}

const BancoHorasForm: React.FC<BancoHorasFormProps> = ({ initialData, onSuccess, create, update }) => {
    const { funcionarios } = useFuncionarios();
    const { showFeedback } = useModal();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [empresa, setEmpresa] = useState<'FEMOG' | 'SEMOG' | ''>(initialData?.empresa || '');
    const [data, setData] = useState(initialData?.data || new Date().toISOString().substring(0, 10));
    const [descricao, setDescricao] = useState(initialData?.descricao || '');
    const [tipo, setTipo] = useState<TipoBancoHoras | ''>(initialData?.tipo || '');
    const [funcionario_id, setFuncionarioId] = useState(initialData?.funcionario_id || '');
    const [duracaoStr, setDuracaoStr] = useState(initialData?.duracao_minutos ? formatMinutesToHHmmHelper(Math.abs(initialData.duracao_minutos)) : '');

    // Reset fields if company changes
    useEffect(() => {
        if (!initialData) {
            setFuncionarioId('');
        }
    }, [empresa, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!empresa || !data || !descricao || !tipo || !funcionario_id || !duracaoStr) {
            showFeedback('error', 'Por favor, preencha todos os campos.');
            return;
        }

        const match = duracaoStr.match(/^\d{1,3}:\d{2}$/);
        if (!match) {
            showFeedback('error', 'Formato de duração inválido. Use HH:MM.');
            return;
        }

        // Always store as positive minutes since type indicates the sign
        const duracao_minutos = Math.abs(parseHHmmToMinutesHelper(duracaoStr));

        const payload: BancoHorasFormData = {
            empresa,
            data,
            descricao,
            tipo,
            funcionario_id,
            duracao_minutos
        } as any;

        try {
            setIsSubmitting(true);
            if (initialData) {
                await update(initialData.id, payload);
                showFeedback('success', 'Registro atualizado com sucesso!');
            } else {
                await create(payload);
                showFeedback('success', 'Registro criado com sucesso!');
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            showFeedback('error', 'Erro ao salvar registro.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Filter employees by selected company
    const filteredFuncionarios = funcionarios.filter(f => f.empresa === empresa);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                    label="Empresa"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value as any)}
                    options={[
                        { value: 'FEMOG', label: 'FEMOG' },
                        { value: 'SEMOG', label: 'SEMOG' }
                    ]}
                    required
                />
                <InputField
                    label="Data"
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    required
                />
            </div>

            <SelectField
                label="Funcionário"
                value={funcionario_id}
                onChange={(e) => setFuncionarioId(e.target.value)}
                options={filteredFuncionarios.map(f => ({ value: f.id, label: f.nome }))}
                required
                disabled={!empresa}
            />

            <SelectField
                label="Tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                options={[
                    { value: 'Positiva', label: 'Positiva (+)' },
                    { value: 'Negativa', label: 'Negativa (-)' },
                    { value: 'Compensação', label: 'Compensação (+)' }
                ]}
                required
            />

            <InputField
                label="Duração (HH:MM)"
                type="text"
                placeholder="Ex: 02:30"
                value={duracaoStr}
                onChange={(e) => {
                    // Simple mask for HH:MM
                    let val = e.target.value.replace(/\D/g, '');
                    if (val.length > 4) val = val.substring(0, 4);
                    if (val.length > 2) {
                        val = val.substring(0, val.length - 2) + ':' + val.substring(val.length - 2);
                    }
                    setDuracaoStr(val);
                }}
                required
            />

            <div className="flex flex-col space-y-1">
                <label className="text-sm font-semibold text-gray-700">Descrição</label>
                <textarea
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    rows={3}
                    placeholder="Ex: Hora extra para cobrir evento..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    required
                />
            </div>

            <div className="flex justify-end pt-4">
                <PrimaryButton type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Salvar'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default BancoHorasForm;
