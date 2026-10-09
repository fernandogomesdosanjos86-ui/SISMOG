import { useState, useEffect, useMemo, type FC, type FormEvent } from 'react';
import type { CategoriaFinanceira, CategoriaFinanceiraFormData, TipoCategoriaFinanceira, StatusCategoriaFinanceira } from '../types';
import { useModal } from '../../../context/ModalContext';
import PrimaryButton from '../../../components/PrimaryButton';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';
import { Layers, FolderTree, AlertCircle } from 'lucide-react';
import { financeiroService } from '../../../services/financeiroService';

interface CategoriaFinanceiraFormProps {
    onSuccess?: () => void;
    initialData?: CategoriaFinanceira;
    defaultParentId?: string | null;
    defaultTipo?: TipoCategoriaFinanceira;
    categoriasPrincipais?: CategoriaFinanceira[];
}

const CategoriaFinanceiraForm: FC<CategoriaFinanceiraFormProps> = ({
    onSuccess,
    initialData,
    defaultParentId,
    defaultTipo,
    categoriasPrincipais = []
}) => {
    const { closeModal, showFeedback } = useModal();
    const [loading, setLoading] = useState(false);

    // Determina se é subcategoria
    const isEditing = !!initialData;
    const initialIsSub = Boolean(initialData?.parent_id || defaultParentId);
    const [isSubcategoria, setIsSubcategoria] = useState<boolean>(initialIsSub);

    // Tipo (Receita ou Despesa)
    const [tipo, setTipo] = useState<TipoCategoriaFinanceira>(
        initialData?.tipo || defaultTipo || 'despesa'
    );

    // Categoria Pai (se for subcategoria)
    const [parentId, setParentId] = useState<string>(
        initialData?.parent_id || defaultParentId || ''
    );

    // Nome
    const [nome, setNome] = useState(initialData?.nome || '');

    // Status
    const [status, setStatus] = useState<StatusCategoriaFinanceira>(
        initialData?.status || 'ativa'
    );

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Categorias principais compatíveis com o Tipo selecionado
    const paisCompativeis = useMemo(() => {
        return categoriasPrincipais.filter(
            (c) => c.tipo === tipo && (!initialData || c.id !== initialData.id)
        );
    }, [categoriasPrincipais, tipo, initialData]);

    // Quando o usuário escolhe uma categoria pai, sincroniza o tipo da categoria pai
    const handleParentChange = (newParentId: string) => {
        setParentId(newParentId);
        if (newParentId) {
            const selectedPai = categoriasPrincipais.find((c) => c.id === newParentId);
            if (selectedPai) {
                setTipo(selectedPai.tipo);
            }
        }
    };

    // Se o tipo mudar e a categoria pai selecionada não for compatível, reseta a categoria pai
    useEffect(() => {
        if (parentId) {
            const paiAtual = categoriasPrincipais.find((c) => c.id === parentId);
            if (paiAtual && paiAtual.tipo !== tipo) {
                setParentId('');
            }
        }
    }, [tipo, categoriasPrincipais, parentId]);

    const validate = () => {
        const errs: Record<string, string> = {};

        if (!nome.trim()) {
            errs.nome = 'O nome da categoria é obrigatório.';
        }

        if (isSubcategoria && !parentId) {
            errs.parentId = 'Selecione a Categoria Principal correspondente.';
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            const payload: CategoriaFinanceiraFormData = {
                tipo,
                nome: nome.trim(),
                parent_id: isSubcategoria ? parentId : null,
                status
            };

            if (isEditing && initialData) {
                await financeiroService.updateCategoriaFinanceira(initialData.id, payload);
                showFeedback('success', 'Categoria financeira atualizada com sucesso!');
            } else {
                await financeiroService.createCategoriaFinanceira(payload);
                showFeedback('success', 'Categoria financeira criada com sucesso!');
            }

            closeModal();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error('Erro ao salvar categoria financeira:', error);
            showFeedback('error', error.message || 'Erro ao salvar categoria financeira.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Seletor de Nível (Principal vs Subcategoria) */}
            {!isEditing && !defaultParentId && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                        Nível da Categoria
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSubcategoria(false);
                                setParentId('');
                            }}
                            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors ${
                                !isSubcategoria
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            <Layers size={16} />
                            Categoria Principal
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsSubcategoria(true)}
                            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium border transition-colors ${
                                isSubcategoria
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            <FolderTree size={16} />
                            Subcategoria
                        </button>
                    </div>
                </div>
            )}

            {/* Aviso se for atalho de subcategoria */}
            {defaultParentId && (
                <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-100 p-3 rounded-lg">
                    <FolderTree size={18} className="shrink-0" />
                    <span>
                        Cadastrando <strong>Subcategoria</strong> vinculada à categoria pai selecionada.
                    </span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo: Receita ou Despesa */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4 pt-1">
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="tipo"
                                value="receita"
                                checked={tipo === 'receita'}
                                onChange={() => setTipo('receita')}
                                disabled={isEditing || Boolean(defaultParentId)}
                                className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                            />
                            <span className="text-sm font-medium text-emerald-700">Receita</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="tipo"
                                value="despesa"
                                checked={tipo === 'despesa'}
                                onChange={() => setTipo('despesa')}
                                disabled={isEditing || Boolean(defaultParentId)}
                                className="w-4 h-4 text-rose-600 border-gray-300 focus:ring-rose-500"
                            />
                            <span className="text-sm font-medium text-rose-700">Despesa</span>
                        </label>
                    </div>
                </div>

                {/* Status */}
                <SelectField
                    label="Status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StatusCategoriaFinanceira)}
                    options={[
                        { value: 'ativa', label: 'Ativa' },
                        { value: 'inativa', label: 'Inativa' }
                    ]}
                    required
                />
            </div>

            {/* Categoria Pai (somente se for Subcategoria) */}
            {isSubcategoria && (
                <div>
                    <SelectField
                        label="Categoria Principal (Pai)"
                        name="parentId"
                        value={parentId}
                        onChange={(e) => handleParentChange(e.target.value)}
                        disabled={Boolean(defaultParentId)}
                        options={[
                            { value: '', label: 'Selecione a Categoria Principal...' },
                            ...paisCompativeis.map((c) => ({
                                value: c.id,
                                label: `${c.nome} (${c.tipo === 'receita' ? 'Receita' : 'Despesa'})`
                            }))
                        ]}
                        error={errors.parentId}
                        required
                    />
                    {paisCompativeis.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={14} /> Nenhuma categoria principal do tipo {tipo} cadastrada. Crie uma primeiro.
                        </p>
                    )}
                </div>
            )}

            {/* Nome da Categoria */}
            <InputField
                label={isSubcategoria ? 'Nome da Subcategoria' : 'Nome da Categoria Principal'}
                name="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={isSubcategoria ? 'Ex: Combustível, Salários...' : 'Ex: Frota e Logística, Folha e Pessoal...'}
                error={errors.nome}
                required
            />

            {/* Rodapé com Botões */}
            <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={closeModal}
                    disabled={loading}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancelar
                </button>
                <PrimaryButton type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : isSubcategoria ? 'Criar Subcategoria' : 'Criar Categoria'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default CategoriaFinanceiraForm;
