import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../../../context/ModalContext';
import { useTrocasPosto } from '../hooks/useTrocasPosto';
import { useFuncionarios } from '../../rh/hooks/useFuncionarios';
import { usePostos } from '../hooks/usePostos';
import { supervisaoService } from '../../../services/supervisaoService';
import { supabase } from '../../../services/supabase';
import PrimaryButton from '../../../components/PrimaryButton';
import { SelectField } from '../../../components/forms/SelectField';
import { InputField } from '../../../components/forms/InputField';
import type { TrocaPosto } from '../types';

interface TrocaPostoFormProps {
    initialData?: TrocaPosto;
    onSuccess?: () => void;
}

const TrocaPostoForm: React.FC<TrocaPostoFormProps> = ({ initialData, onSuccess }) => {
    const { user } = useAuth();
    const { closeModal, showFeedback, openConfirmModal } = useModal();
    const { create, update, isCreating, isUpdating } = useTrocasPosto();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Data Hooks
    const { funcionarios } = useFuncionarios();
    const { postos } = usePostos();

    // Local State
    const [empresa, setEmpresa] = useState<'FEMOG' | 'SEMOG' | ''>(initialData?.empresa || 'FEMOG');
    const [funcionarioId, setFuncionarioId] = useState(initialData?.funcionario_id || '');
    const [postoOriginalId, setPostoOriginalId] = useState(initialData?.posto_original_id || '');
    const [postoCoberturaId, setPostoCoberturaId] = useState(initialData?.posto_cobertura_id || '');
    const [data, setData] = useState(initialData?.data || new Date().toISOString().substring(0, 10));
    const [observacoes, setObservacoes] = useState(initialData?.observacoes || '');

    // Funcionários filtrados por empresa
    const funcionariosDisponiveis = useMemo(() => {
        return funcionarios
            .filter(f => {
                const isInactive = f.status === 'inativo' || !!f.data_desligamento;
                if (isInactive && f.id !== initialData?.funcionario_id) return false;
                return !empresa || f.empresa === empresa;
            })
            .sort((a, b) => a.nome.localeCompare(b.nome));
    }, [funcionarios, empresa, initialData]);

    // Postos Originais (de acordo com a empresa selecionada)
    const postosOriginais = useMemo(() => {
        return postos
            .filter(p => {
                if (p.status !== 'ativo' && p.id !== initialData?.posto_original_id) return false;
                return !empresa || p.empresa === empresa;
            })
            .sort((a, b) => a.nome.localeCompare(b.nome));
    }, [postos, empresa, initialData]);

    // Postos Cobertura (todos os postos das duas empresas, exceto o original selecionado)
    const postosCobertura = useMemo(() => {
        return postos
            .filter(p => {
                if (p.status !== 'ativo' && p.id !== initialData?.posto_cobertura_id) return false;
                if (postoOriginalId && p.id === postoOriginalId) return false;
                return true;
            })
            .sort((a, b) => {
                const compA = a.empresa || '';
                const compB = b.empresa || '';
                if (compA !== compB) return compA.localeCompare(compB);
                return a.nome.localeCompare(b.nome);
            });
    }, [postos, postoOriginalId, initialData]);

    // Ao selecionar um funcionário, auto-detectar o posto original se tiver alocação
    useEffect(() => {
        if (!funcionarioId || initialData) return;

        let isMounted = true;
        supervisaoService.getAlocacoesByFuncionario(funcionarioId).then(alocs => {
            if (!isMounted) return;
            const alocValida = alocs.find(a => a.posto && (!empresa || a.posto.empresa === empresa));
            if (alocValida?.posto_id) {
                setPostoOriginalId(alocValida.posto_id);
            }
        }).catch(err => {
            console.error('Erro ao buscar alocação do funcionário:', err);
        });

        return () => {
            isMounted = false;
        };
    }, [funcionarioId, empresa, initialData]);

    const executeSave = async () => {
        if (!empresa) return;
        if (initialData) {
            await update({
                id: initialData.id,
                data: {
                    empresa: empresa as 'FEMOG' | 'SEMOG',
                    funcionario_id: funcionarioId,
                    posto_original_id: postoOriginalId,
                    posto_cobertura_id: postoCoberturaId,
                    data,
                    observacoes: observacoes.trim() || null,
                }
            });
            showFeedback('success', 'Troca de posto atualizada com sucesso!');
        } else {
            await create({
                empresa: empresa as 'FEMOG' | 'SEMOG',
                funcionario_id: funcionarioId,
                posto_original_id: postoOriginalId,
                posto_cobertura_id: postoCoberturaId,
                data,
                observacoes: observacoes.trim() || null,
                solicitante_id: user?.id || null,
            });
            showFeedback('success', 'Troca de posto registrada com sucesso!');
        }

        if (onSuccess) onSuccess();
        closeModal();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!empresa || !funcionarioId || !postoOriginalId || !postoCoberturaId || !data) {
            showFeedback('error', 'Preencha todos os campos obrigatórios.');
            return;
        }

        if (postoOriginalId === postoCoberturaId) {
            showFeedback('error', 'O posto de cobertura deve ser diferente do posto original.');
            return;
        }

        try {
            setIsSubmitting(true);
            let query = supabase
                .from('supervisao_trocas_posto')
                .select('id')
                .eq('empresa', empresa)
                .eq('funcionario_id', funcionarioId)
                .eq('data', data);

            if (initialData?.id) {
                query = query.neq('id', initialData.id);
            }

            const { data: existing, error } = await query;

            if (!error && existing && existing.length > 0) {
                setIsSubmitting(false);
                openConfirmModal(
                    'Possível Duplicidade',
                    'Já existe um registro semelhante com as mesmas informações. Deseja continuar o lançamento?',
                    async () => {
                        await executeSave();
                    }
                );
                return;
            }

            await executeSave();
        } catch (error: any) {
            console.error('Erro ao salvar troca de posto:', error);
            showFeedback('error', error?.message || 'Erro ao registrar troca de posto.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Empresa */}
                <SelectField
                    label="Empresa"
                    value={empresa}
                    onChange={(e) => {
                        const newEmp = e.target.value as 'FEMOG' | 'SEMOG';
                        setEmpresa(newEmp);
                        setFuncionarioId('');
                        setPostoOriginalId('');
                        setPostoCoberturaId('');
                    }}
                    required
                    options={[
                        { value: 'FEMOG', label: 'FEMOG' },
                        { value: 'SEMOG', label: 'SEMOG' }
                    ]}
                />

                {/* Funcionário */}
                <SelectField
                    label="Funcionário"
                    value={funcionarioId}
                    onChange={(e) => {
                        setFuncionarioId(e.target.value);
                    }}
                    required
                    disabled={!empresa}
                    options={funcionariosDisponiveis.map(f => ({
                        value: f.id,
                        label: f.nome
                    }))}
                />

                {/* Posto Original */}
                <SelectField
                    label="Posto Original"
                    value={postoOriginalId}
                    onChange={(e) => {
                        const novoOriginal = e.target.value;
                        setPostoOriginalId(novoOriginal);
                        if (postoCoberturaId === novoOriginal) {
                            setPostoCoberturaId('');
                        }
                    }}
                    required
                    disabled={!empresa}
                    options={postosOriginais.map(p => ({
                        value: p.id,
                        label: p.nome
                    }))}
                />

                {/* Posto para Cobertura */}
                <SelectField
                    label="Posto para Cobertura"
                    value={postoCoberturaId}
                    onChange={(e) => setPostoCoberturaId(e.target.value)}
                    required
                    options={postosCobertura.map(p => ({
                        value: p.id,
                        label: `${p.nome} (${p.empresa})`
                    }))}
                />

                {/* Data */}
                <div className="md:col-span-2">
                    <InputField
                        label="Data"
                        type="date"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        required
                    />
                </div>

                {/* Observações */}
                <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Observações</label>
                    <textarea
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Informe o motivo operacional do deslocamento (opcional)..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                    Cancelar
                </button>
                <PrimaryButton type="submit" disabled={isCreating || isUpdating || isSubmitting}>
                    {isCreating || isUpdating || isSubmitting ? 'Salvando...' : (initialData ? 'Salvar Alterações' : 'Registrar Troca')}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default TrocaPostoForm;
