import { useState, useMemo, type FC } from 'react';
import PageHeader from '../../components/PageHeader';
import PrimaryButton from '../../components/PrimaryButton';
import StatusBadge from '../../components/StatusBadge';
import FilterTabs from '../../components/ui/FilterTabs';
import { TableSkeleton, CardSkeleton } from '../../components/SkeletonLoader';
import { useModal } from '../../context/ModalContext';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import { tolerantIncludes } from '../../utils/normalization';
import { useCategoriasFinanceiras } from './hooks/useCategoriasFinanceiras';
import type {
    CategoriaFinanceira,
    TipoCategoriaFinanceira,
    StatusCategoriaFinanceira,
    CategoriaComSubcategorias
} from './types';
import CategoriaFinanceiraForm from './components/CategoriaFinanceiraForm';
import {
    Plus,
    Search,
    ShieldAlert,
    ChevronDown,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    Edit2,
    Power,
    Layers,
    Tag,
    CornerDownRight,
    ChevronsUpDown
} from 'lucide-react';

const CategoriasFinanceiras: FC = () => {
    const { user } = useAuth();
    const { openFormModal, showFeedback } = useModal();
    const {
        arvoreCategorias,
        categoriasPrincipais,
        isLoading,
        refetch,
        toggleStatus
    } = useCategoriasFinanceiras();

    // 1. Verificação de Permissão no Front-End
    const permissao = (user?.user_metadata?.['permissao'] as string)?.toLowerCase();
    const setor = (user?.user_metadata?.['setor'] as string)?.toLowerCase();
    const hasPermission =
        permissao === 'adm' || (permissao === 'gestor' && (setor === 'financeiro' || setor === 'direção'));

    // Estados de filtros
    const [tipoFilter, setTipoFilter] = useState<'TODAS' | TipoCategoriaFinanceira>('TODAS');
    const [statusFilter, setStatusFilter] = useState<'TODOS' | StatusCategoriaFinanceira>('TODOS');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 250);

    // Estado do acordeão (quais categorias estão expandidas)
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set<string>());

    // Alternar expansão de uma categoria pai
    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Expandir ou recolher todas
    const expandAll = (ids: string[]) => {
        setExpandedIds(new Set(ids));
    };
    const collapseAll = () => {
        setExpandedIds(new Set());
    };

    // Filtragem tolerante com busca hierárquica
    const arvoreFiltrada = useMemo(() => {
        const term = debouncedSearch.trim();

        return arvoreCategorias
            .filter((pai) => {
                // Filtro por tipo
                if (tipoFilter !== 'TODAS' && pai.tipo !== tipoFilter) {
                    return false;
                }
                return true;
            })
            .map((pai) => {
                // Filtra subcategorias pelo status se aplicável
                let subcategoriasFiltradas = pai.subcategorias.filter((sub) => {
                    if (statusFilter !== 'TODOS' && sub.status !== statusFilter) {
                        return false;
                    }
                    return true;
                });

                // Se houver busca por texto: tolerante a acentos e maiúsculas
                if (term) {
                    const paiMatch = tolerantIncludes(pai.nome, term);
                    const subMatches = subcategoriasFiltradas.filter((sub) =>
                        tolerantIncludes(sub.nome, term)
                    );

                    // Se a categoria pai bateu, mantém ela com todas as subcategorias compatíveis
                    // Se apenas subcategorias bateram, exibe a categoria pai apenas com as subcategorias que bateram
                    if (paiMatch) {
                        return { ...pai, subcategorias: subcategoriasFiltradas };
                    }
                    if (subMatches.length > 0) {
                        return { ...pai, subcategorias: subMatches };
                    }
                    // Nenhum dos dois bateu
                    return null;
                }

                // Se não há termo de busca, aplica apenas o filtro de status no pai
                if (statusFilter !== 'TODOS' && pai.status !== statusFilter) {
                    // Se o pai tem o status diferente, mas talvez tenhamos subcategorias?
                    // Por regra, o filtro de status filtra itens correspondentes
                    if (subcategoriasFiltradas.length === 0) {
                        return null;
                    }
                }

                return { ...pai, subcategorias: subcategoriasFiltradas };
            })
            .filter((pai): pai is CategoriaComSubcategorias => pai !== null);
    }, [arvoreCategorias, tipoFilter, statusFilter, debouncedSearch]);

    // IDs das categorias visíveis para expandir/recolher
    const visibleParentIds = useMemo(() => arvoreFiltrada.map((p) => p.id), [arvoreFiltrada]);

    // Se houver busca ativa, auto-expande os nós correspondentes para conveniência
    useMemo(() => {
        if (debouncedSearch.trim()) {
            setExpandedIds(new Set(visibleParentIds));
        }
    }, [debouncedSearch, visibleParentIds]);

    // Ações de Modal
    const handleNovaCategoria = () => {
        openFormModal(
            'Nova Categoria Financeira',
            <CategoriaFinanceiraForm
                categoriasPrincipais={categoriasPrincipais}
                defaultTipo={tipoFilter !== 'TODAS' ? tipoFilter : undefined}
                onSuccess={refetch}
            />
        );
    };

    const handleNovaSubcategoria = (pai: CategoriaFinanceira) => {
        openFormModal(
            `Nova Subcategoria - ${pai.nome}`,
            <CategoriaFinanceiraForm
                defaultParentId={pai.id}
                defaultTipo={pai.tipo}
                categoriasPrincipais={categoriasPrincipais}
                onSuccess={() => {
                    refetch();
                    setExpandedIds((prev) => new Set([...prev, pai.id]));
                }}
            />
        );
    };

    const handleEditar = (item: CategoriaFinanceira) => {
        const isSub = Boolean(item.parent_id);
        openFormModal(
            isSub ? `Editar Subcategoria: ${item.nome}` : `Editar Categoria: ${item.nome}`,
            <CategoriaFinanceiraForm
                initialData={item}
                categoriasPrincipais={categoriasPrincipais}
                onSuccess={refetch}
            />
        );
    };

    const handleToggleStatus = async (item: CategoriaFinanceira) => {
        const novoStatus: StatusCategoriaFinanceira = item.status === 'ativa' ? 'inativa' : 'ativa';
        const acao = novoStatus === 'ativa' ? 'ativar' : 'inativar';
        const isSub = Boolean(item.parent_id);

        try {
            await toggleStatus({ id: item.id, status: novoStatus });
            showFeedback('success', `${isSub ? 'Subcategoria' : 'Categoria'} alterada para ${novoStatus} com sucesso!`);
        } catch (error: any) {
            console.error('Erro ao alternar status:', error);
            showFeedback('error', error.message || `Erro ao ${acao} ${isSub ? 'subcategoria' : 'categoria'}.`);
        }
    };

    // Verificação de permissão
    if (!hasPermission) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-xl p-8 border border-gray-100 text-center">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
                    <ShieldAlert size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Acesso Restrito</h3>
                <p className="text-gray-500 max-w-md text-sm">
                    Você não possui permissão para visualizar o módulo de Categorias Financeiras.
                    Este setor é restrito a administradores e gestores do setor Financeiro.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Categorias Financeiras"
                subtitle="Classificação gerencial de receitas e despesas em dois níveis (global SEMOG & FEMOG)"
                action={
                    <PrimaryButton onClick={handleNovaCategoria} className="w-full sm:w-auto justify-center">
                        <Plus size={16} className="mr-2" />
                        Nova Categoria
                    </PrimaryButton>
                }
            />

            {/* Barra de Filtros e Busca */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome de categoria principal ou subcategoria..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                    <select
                        className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="TODOS">Todos os Status</option>
                        <option value="ativa">Ativas</option>
                        <option value="inativa">Inativas</option>
                    </select>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => expandAll(visibleParentIds)}
                            title="Expandir todas as categorias"
                            className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors"
                        >
                            <ChevronsUpDown size={14} />
                            Expandir
                        </button>
                        <button
                            type="button"
                            onClick={collapseAll}
                            title="Recolher todas as categorias"
                            className="flex-1 sm:flex-none px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1 transition-colors"
                        >
                            Recolher
                        </button>
                    </div>
                </div>
            </div>

            {/* Abas segmentadas por Tipo - Após a barra de busca e filtros (Padrão SISMOG) */}
            <FilterTabs
                tabs={[
                    { id: 'TODAS', label: 'Todas' },
                    { id: 'receita', label: 'Receitas' },
                    { id: 'despesa', label: 'Despesas' },
                ]}
                activeTab={tipoFilter}
                onChange={(tabId) => setTipoFilter(tabId as any)}
                className="w-fit mb-4"
            />

            {/* Estado de Carregamento */}
            {isLoading && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="hidden md:block">
                        <TableSkeleton rows={6} columns={5} />
                    </div>
                    <div className="md:hidden">
                        <CardSkeleton count={4} />
                    </div>
                </div>
            )}

            {/* Estado Vazio */}
            {!isLoading && arvoreFiltrada.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Layers size={28} />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Nenhuma categoria encontrada</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                        {searchTerm
                            ? `Nenhum resultado correspondente a "${searchTerm}". Tente outros termos.`
                            : 'Não existem categorias cadastradas para os filtros selecionados.'}
                    </p>
                    <PrimaryButton onClick={handleNovaCategoria} className="inline-flex">
                        <Plus size={16} className="mr-2" />
                        Criar Categoria
                    </PrimaryButton>
                </div>
            )}

            {/* Listagem em Tabela com Acordeão (Desktop: md+) */}
            {!isLoading && arvoreFiltrada.length > 0 && (
                <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-gray-200 text-xs uppercase font-semibold text-gray-600 tracking-wider">
                                    <th className="px-6 py-3.5">Categoria / Subcategoria</th>
                                    <th className="px-6 py-3.5 w-36">Tipo</th>
                                    <th className="px-6 py-3.5 w-44">Estrutura</th>
                                    <th className="px-6 py-3.5 w-32">Status</th>
                                    <th className="px-6 py-3.5 w-56 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {arvoreFiltrada.map((pai) => {
                                    const isExpanded = expandedIds.has(pai.id);
                                    const hasSubs = pai.subcategorias.length > 0;
                                    const isReceita = pai.tipo === 'receita';

                                    return (
                                        <div key={pai.id} style={{ display: 'contents' }}>
                                            {/* Linha da Categoria Principal */}
                                            <tr
                                                className={`transition-colors border-l-4 ${
                                                    isReceita ? 'border-emerald-500' : 'border-rose-500'
                                                } ${isExpanded ? 'bg-slate-50/70' : 'bg-white hover:bg-slate-50/50'}`}
                                            >
                                                {/* Nome e Botão Expansor */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleExpand(pai.id)}
                                                            className={`p-1 rounded hover:bg-gray-200 text-gray-500 transition-transform duration-200 ${
                                                                isExpanded ? 'rotate-90 text-blue-600' : ''
                                                            }`}
                                                            title={isExpanded ? 'Recolher' : 'Expandir subcategorias'}
                                                        >
                                                            <ChevronRight size={18} />
                                                        </button>

                                                        <div
                                                            className="flex items-center gap-2.5 cursor-pointer select-none"
                                                            onClick={() => toggleExpand(pai.id)}
                                                        >
                                                            <div
                                                                className={`p-2 rounded-lg ${
                                                                    isReceita
                                                                        ? 'bg-emerald-50 text-emerald-700'
                                                                        : 'bg-rose-50 text-rose-700'
                                                                }`}
                                                            >
                                                                <Layers size={16} />
                                                            </div>
                                                            <div>
                                                                <span className="font-semibold text-gray-900 block">
                                                                    {pai.nome}
                                                                </span>
                                                                <span className="text-xs text-gray-400 font-normal">
                                                                    Categoria Principal (Grupo)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Tipo */}
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                            isReceita
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                        }`}
                                                    >
                                                        {isReceita ? (
                                                            <TrendingUp size={13} />
                                                        ) : (
                                                            <TrendingDown size={13} />
                                                        )}
                                                        {isReceita ? 'Receita' : 'Despesa'}
                                                    </span>
                                                </td>

                                                {/* Quantidade de Subcategorias */}
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                        {pai.subcategorias.length}{' '}
                                                        {pai.subcategorias.length === 1 ? 'subcategoria' : 'subcategorias'}
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4">
                                                    <StatusBadge
                                                        active={pai.status === 'ativa'}
                                                        activeLabel="Ativa"
                                                        inactiveLabel="Inativa"
                                                    />
                                                </td>

                                                {/* Ações da Categoria Principal */}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* Atalho rápido para adicionar subcategoria */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleNovaSubcategoria(pai)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                                                            title="Adicionar Subcategoria neste grupo"
                                                        >
                                                            <Plus size={14} />
                                                            <span>Subcategoria</span>
                                                        </button>

                                                        {/* Editar */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditar(pai)}
                                                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Editar categoria"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>

                                                        {/* Ativar / Inativar */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleStatus(pai)}
                                                            className={`p-1.5 rounded-lg transition-colors ${
                                                                pai.status === 'ativa'
                                                                    ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                                                                    : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                                                            }`}
                                                            title={
                                                                pai.status === 'ativa'
                                                                    ? 'Inativar categoria'
                                                                    : 'Ativar categoria'
                                                            }
                                                        >
                                                            <Power size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Subcategorias vinculadas (quando expandido) */}
                                            {isExpanded && (
                                                <>
                                                    {hasSubs ? (
                                                        pai.subcategorias.map((sub) => (
                                                            <tr
                                                                key={sub.id}
                                                                className="bg-slate-50/40 hover:bg-blue-50/40 transition-colors border-l-4 border-l-transparent"
                                                            >
                                                                {/* Nome com Recuo Visual */}
                                                                <td className="px-6 py-3 pl-16">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <CornerDownRight
                                                                            size={16}
                                                                            className="text-gray-300 shrink-0"
                                                                        />
                                                                        <div className="p-1.5 bg-white border border-gray-200 text-gray-600 rounded-md shrink-0">
                                                                            <Tag size={13} />
                                                                        </div>
                                                                        <span className="font-medium text-gray-800">
                                                                            {sub.nome}
                                                                        </span>
                                                                    </div>
                                                                </td>

                                                                {/* Tipo */}
                                                                <td className="px-6 py-3">
                                                                    <span className="text-xs text-gray-500 font-medium">
                                                                        {sub.tipo === 'receita' ? 'Receita' : 'Despesa'}
                                                                    </span>
                                                                </td>

                                                                {/* Estrutura */}
                                                                <td className="px-6 py-3">
                                                                    <span className="text-xs text-gray-400 italic">
                                                                        Subcategoria
                                                                    </span>
                                                                </td>

                                                                {/* Status */}
                                                                <td className="px-6 py-3">
                                                                    <StatusBadge
                                                                        active={sub.status === 'ativa'}
                                                                        activeLabel="Ativa"
                                                                        inactiveLabel="Inativa"
                                                                    />
                                                                </td>

                                                                {/* Ações da Subcategoria */}
                                                                <td className="px-6 py-3 text-right">
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        {/* Editar */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleEditar(sub)}
                                                                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                            title="Editar subcategoria"
                                                                        >
                                                                            <Edit2 size={15} />
                                                                        </button>

                                                                        {/* Ativar / Inativar */}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleToggleStatus(sub)}
                                                                            className={`p-1.5 rounded-lg transition-colors ${
                                                                                sub.status === 'ativa'
                                                                                    ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                                                                                    : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                                                                            }`}
                                                                            title={
                                                                                sub.status === 'ativa'
                                                                                    ? 'Inativar subcategoria'
                                                                                    : 'Ativar subcategoria'
                                                                            }
                                                                        >
                                                                            <Power size={15} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr className="bg-slate-50/30">
                                                            <td
                                                                colSpan={5}
                                                                className="px-6 py-3 pl-16 text-xs text-gray-400 italic"
                                                            >
                                                                Nenhuma subcategoria vinculada. Clique em "+ Subcategoria"
                                                                para cadastrar.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Listagem Mobile (Cards com Acordeão: < md) */}
            {!isLoading && arvoreFiltrada.length > 0 && (
                <div className="md:hidden space-y-3">
                    {arvoreFiltrada.map((pai) => {
                        const isExpanded = expandedIds.has(pai.id);
                        const isReceita = pai.tipo === 'receita';

                        return (
                            <div
                                key={pai.id}
                                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
                                    isReceita ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-rose-500'
                                } border-gray-200`}
                            >
                                <div className="p-4 space-y-3">
                                    {/* Linha Superior */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div
                                            className="flex items-center gap-2 cursor-pointer flex-1"
                                            onClick={() => toggleExpand(pai.id)}
                                        >
                                            <div
                                                className={`p-2 rounded-lg ${
                                                    isReceita
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-rose-50 text-rose-700'
                                                }`}
                                            >
                                                <Layers size={16} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 text-sm">{pai.nome}</h4>
                                                <span className="text-xs text-gray-400">
                                                    {pai.subcategorias.length}{' '}
                                                    {pai.subcategorias.length === 1 ? 'subcategoria' : 'subcategorias'}
                                                </span>
                                            </div>
                                        </div>

                                        <StatusBadge
                                            active={pai.status === 'ativa'}
                                            activeLabel="Ativa"
                                            inactiveLabel="Inativa"
                                        />
                                    </div>

                                    {/* Linha de Tags e Ações Rápidas */}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                isReceita
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-rose-50 text-rose-700'
                                            }`}
                                        >
                                            {isReceita ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                            {isReceita ? 'Receita' : 'Despesa'}
                                        </span>

                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleNovaSubcategoria(pai)}
                                                className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1"
                                            >
                                                <Plus size={13} />
                                                Sub
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleEditar(pai)}
                                                className="p-1.5 text-gray-500 hover:text-blue-600 rounded-lg"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(pai)}
                                                className={`p-1.5 rounded-lg ${
                                                    pai.status === 'ativa' ? 'text-gray-400 hover:text-rose-600' : 'text-gray-400 hover:text-emerald-600'
                                                }`}
                                            >
                                                <Power size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleExpand(pai.id)}
                                                className={`p-1.5 text-gray-500 transition-transform ${
                                                    isExpanded ? 'rotate-180 text-blue-600' : ''
                                                }`}
                                            >
                                                <ChevronDown size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Subcategorias no Card Mobile */}
                                {isExpanded && (
                                    <div className="bg-slate-50 border-t border-gray-100 p-3 space-y-2">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Subcategorias vinculadas:
                                        </p>
                                        {pai.subcategorias.length > 0 ? (
                                            <div className="divide-y divide-gray-200/60">
                                                {pai.subcategorias.map((sub) => (
                                                    <div
                                                        key={sub.id}
                                                        className="py-2 flex items-center justify-between gap-2"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Tag size={13} className="text-gray-400" />
                                                            <span className="text-sm font-medium text-gray-800">
                                                                {sub.nome}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <StatusBadge
                                                                active={sub.status === 'ativa'}
                                                                activeLabel="Ativa"
                                                                inactiveLabel="Inativa"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditar(sub)}
                                                                className="p-1 text-gray-500 hover:text-blue-600"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleStatus(sub)}
                                                                className={`p-1 ${
                                                                    sub.status === 'ativa'
                                                                        ? 'text-gray-400 hover:text-rose-600'
                                                                        : 'text-gray-400 hover:text-emerald-600'
                                                                }`}
                                                            >
                                                                <Power size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">
                                                Nenhuma subcategoria cadastrada.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CategoriasFinanceiras;
