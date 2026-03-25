import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../../../context/ModalContext';
import { useTrocasPlantao } from '../hooks/useTrocasPlantao';
import { useFuncionarios } from '../../rh/hooks/useFuncionarios';
import { useAlocacoes } from '../hooks/useAlocacoes';
import { supervisaoService } from '../../../services/supervisaoService';
import { useQuery } from '@tanstack/react-query';
import PrimaryButton from '../../../components/PrimaryButton';
import { SelectField } from '../../../components/forms/SelectField';
import { InputField } from '../../../components/forms/InputField';

interface TrocaPlantaoFormProps {
    initialData?: any;
}

const TrocaPlantaoForm: React.FC<TrocaPlantaoFormProps> = ({ initialData }) => {
    const { user } = useAuth();
    const isOperador = user?.user_metadata?.permissao === 'Operador';
    const { closeModal, showFeedback } = useModal();
    const { create, update, isCreating, isUpdating } = useTrocasPlantao();
    
    // Global Hooks
    const { funcionarios } = useFuncionarios();
    
    // Local State
    const [empresa, setEmpresa] = useState<'FEMOG' | 'SEMOG' | ''>(initialData?.empresa || '');
    const [postoId, setPostoId] = useState(initialData?.posto_id || '');
    const [funcionarioId, setFuncionarioId] = useState(initialData?.funcionario_id || '');
    const [funcionarioTrocaId, setFuncionarioTrocaId] = useState(initialData?.funcionario_troca_id || '');
    const [dataOriginal, setDataOriginal] = useState(initialData?.data_original || '');
    const [dataReposicao, setDataReposicao] = useState(initialData?.data_reposicao || '');

    // --- Operator Identity: ALL records matching the CPF (can be 2 if in both companies) ---
    const operadorMatches = useMemo(() => {
        if (!isOperador || !user || !user.user_metadata?.cpf) return [];
        const secureCpfSession = user.user_metadata.cpf.replace(/\D/g, '');
        return funcionarios.filter(f => f.cpf && f.cpf.replace(/\D/g, '') === secureCpfSession);
    }, [isOperador, user, funcionarios]);

    // Kept for backwards-compat (label display, etc.) — first match
    const operadorMatch = operadorMatches[0] ?? null;

    // All IDs across both companies
    const operadorIds = useMemo(() => operadorMatches.map(f => f.id), [operadorMatches]);

    // --- Fetch allocations for ALL employee IDs of the operator ---
    const { data: operadorAlocacoes = [] } = useQuery({
        queryKey: ['operadorAlocacoes', ...operadorIds],
        queryFn: async () => {
            const results = await Promise.all(
                operadorIds.map(id => supervisaoService.getAlocacoesByFuncionario(id))
            );
            return results.flat();
        },
        enabled: isOperador && operadorIds.length > 0,
    });

    // Unique companies the operator has HE=false allocations in
    const empresasOperador = useMemo(() => {
        const set = new Set(operadorAlocacoes.map(a => a.posto?.empresa).filter(Boolean));
        return Array.from(set) as Array<'FEMOG' | 'SEMOG'>;
    }, [operadorAlocacoes]);

    // Posts for the selected company (operator only)
    const postosOperadorParaEmpresa = useMemo(() => {
        return operadorAlocacoes
            .filter(a => a.posto?.empresa === empresa && a.posto?.status === 'ativo')
            .map(a => a.posto!);
    }, [operadorAlocacoes, empresa]);

    // --- Auto-fill: empresa (if single) ---
    useEffect(() => {
        if (!isOperador || initialData) return;
        if (empresasOperador.length === 1 && !empresa) {
            setEmpresa(empresasOperador[0]);
        }
    }, [isOperador, empresasOperador, empresa, initialData]);

    // --- Auto-fill: funcionarioId when empresa changes ---
    // João FEMOG -> use his FEMOG record; João SEMOG -> use his SEMOG record
    useEffect(() => {
        if (!isOperador || !empresa) return;
        const matchForEmpresa = operadorMatches.find(f => f.empresa === empresa);
        if (matchForEmpresa && funcionarioId !== matchForEmpresa.id) {
            setFuncionarioId(matchForEmpresa.id);
        }
    }, [isOperador, empresa, operadorMatches, funcionarioId]);

    // --- Seed first funcionarioId on load when only one company ---
    useEffect(() => {
        if (!isOperador || funcionarioId || !operadorMatch) return;
        setFuncionarioId(operadorMatch.id);
    }, [isOperador, operadorMatch, funcionarioId]);

    // Auto-select posto when there's exactly one option for the chosen company
    useEffect(() => {
        if (!isOperador || !empresa || initialData) return;
        if (postosOperadorParaEmpresa.length === 1) {
            setPostoId(postosOperadorParaEmpresa[0].id);
        } else if (postosOperadorParaEmpresa.length === 0) {
            setPostoId('');
        }
    }, [isOperador, empresa, postosOperadorParaEmpresa, initialData]);

    // Allocations of the selected posto (to list co-workers available as substitutes)
    const { alocacoes: alocacoesDoPosto } = useAlocacoes(postoId);

    // Filtered Target Employees for substitution
    const funcionariosTrocaDisponiveis = useMemo(() => {
        if (isOperador) {
            return alocacoesDoPosto
                .filter(a => a.he === false && a.funcionario_id !== funcionarioId)
                .map(a => a.funcionario
                    ? { id: a.funcionario_id, nome: a.funcionario.nome }
                    : { id: a.funcionario_id, nome: 'Desconhecido' });
        } else {
            let list = funcionarios;
            if (empresa) list = list.filter(f => f.empresa === empresa);
            return list.filter(f => f.id !== funcionarioId);
        }
    }, [isOperador, alocacoesDoPosto, funcionarios, empresa, funcionarioId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!empresa || !postoId || !dataOriginal || !dataReposicao || !funcionarioTrocaId || !funcionarioId) {
            showFeedback('error', 'Preencha todos os campos.');
            return;
        }

        try {
            if (initialData) {
                await update({
                    id: initialData.id,
                    data: {
                        empresa,
                        posto_id: postoId,
                        funcionario_id: funcionarioId,
                        data_original: dataOriginal,
                        data_reposicao: dataReposicao,
                        funcionario_troca_id: funcionarioTrocaId,
                    }
                });
                showFeedback('success', 'Solicitação atualizada com sucesso!');
            } else {
                await create({
                    empresa,
                    posto_id: postoId,
                    funcionario_id: funcionarioId,
                    data_original: dataOriginal,
                    data_reposicao: dataReposicao,
                    funcionario_troca_id: funcionarioTrocaId,
                    solicitante_id: user!.id,
                    status: isOperador ? 'Pendente' : 'Autorizado',
                    de_acordo: isOperador ? null : true
                } as any);
                showFeedback('success', `Solicitação de Troca de Plantão ${isOperador ? 'enviada para análise' : 'autorizada com sucesso'}!`);
            }
            closeModal();
        } catch (error: any) {
            console.error(error);
            showFeedback('error', 'Erro ao salvar a requisição.');
        }
    };

    const [postos, setPostos] = React.useState<Array<{id: string; nome: string; empresa: string; status: string}>>([]);
    useEffect(() => {
        if (!isOperador) {
            import('../../../services/supervisaoService').then(m =>
                m.supervisaoService.getPostos().then(data => setPostos(data as any))
            );
        }
    }, [isOperador]);

    const postosGestor = useMemo(() => {
        return postos.filter(p => p.status === 'ativo' && (!empresa || p.empresa === empresa));
    }, [postos, empresa]);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Empresa */}
                {isOperador && empresasOperador.length <= 1 ? (
                    // Auto-selected: show a read-only display instead of dropdown
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Empresa</label>
                        <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-sm text-gray-800 font-semibold">
                            {empresa || '—'}
                        </div>
                    </div>
                ) : (
                    <SelectField
                        label="Empresa"
                        value={empresa}
                        onChange={(e) => {
                            setEmpresa(e.target.value as any);
                            setPostoId('');
                            if (!isOperador) setFuncionarioId('');
                            setFuncionarioTrocaId('');
                        }}
                        required
                        options={
                            isOperador
                                ? empresasOperador.map(emp => ({ value: emp, label: emp }))
                                : [
                                    { value: 'FEMOG', label: 'FEMOG' },
                                    { value: 'SEMOG', label: 'SEMOG' }
                                ]
                        }
                    />
                )}

                {/* Funcionário (solicitante) */}
                {(() => {
                    // For operators: always show the record that belongs to the currently selected company
                    const operadorParaEmpresa = isOperador
                        ? (empresa
                            ? operadorMatches.find(f => f.empresa === empresa) ?? operadorMatch
                            : operadorMatch)
                        : null;
                    return (
                        <SelectField
                            label="Funcionário"
                            value={funcionarioId}
                            onChange={(e) => setFuncionarioId(e.target.value)}
                            required
                            disabled={isOperador}
                            options={
                                isOperador && operadorParaEmpresa
                                    ? [{ value: operadorParaEmpresa.id, label: operadorParaEmpresa.nome }]
                                    : funcionarios.filter(f => f.empresa === empresa || !empresa).map(f => ({ value: f.id, label: f.nome }))
                            }
                        />
                    );
                })()}

                {/* Posto de Trabalho */}
                {isOperador && postosOperadorParaEmpresa.length <= 1 ? (
                    // Auto-selected: show read-only
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Posto de Trabalho</label>
                        <div className="border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-sm text-gray-800 font-semibold">
                            {postosOperadorParaEmpresa[0]?.nome || '—'}
                        </div>
                    </div>
                ) : (
                    <SelectField
                        label="Posto de Trabalho"
                        value={postoId}
                        onChange={(e) => {
                            setPostoId(e.target.value);
                            setFuncionarioTrocaId('');
                        }}
                        required
                        disabled={!empresa}
                        options={
                            isOperador
                                ? postosOperadorParaEmpresa.map(p => ({ value: p.id, label: p.nome }))
                                : postosGestor.map(p => ({ value: p.id, label: p.nome }))
                        }
                    />
                )}

                {/* Substituto */}
                <SelectField
                    label="Substituto (Quem cobrirá)"
                    value={funcionarioTrocaId}
                    onChange={(e) => setFuncionarioTrocaId(e.target.value)}
                    required
                    disabled={!postoId}
                    options={funcionariosTrocaDisponiveis.map(f => ({ value: f.id, label: f.nome }))}
                />

                <InputField
                    label="Data Original"
                    type="date"
                    value={dataOriginal}
                    onChange={(e) => setDataOriginal(e.target.value)}
                    required
                />

                <InputField
                    label="Data da Reposição"
                    type="date"
                    value={dataReposicao}
                    onChange={(e) => setDataReposicao(e.target.value)}
                    required
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancelar
                </button>
                <PrimaryButton type="submit" disabled={isCreating || isUpdating}>
                    {isCreating || isUpdating ? 'Processando...' : (initialData ? 'Salvar Alterações' : isOperador ? 'Solicitar Troca' : 'Autorizar Troca')}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default TrocaPlantaoForm;
