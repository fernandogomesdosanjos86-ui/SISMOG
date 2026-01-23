import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Package, Send, RotateCcw, Trash2, Eye, Pencil, Search, PackagePlus, Recycle } from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';

import { useToast } from '../../components/ui/Toast';
import { estoqueService } from '../../services/estoqueService';
import { funcionariosService } from '../../services/funcionariosService';
import { contratosService } from '../../services/contratosService';
import { getBorderColor } from '../../utils/styles';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

// ============ SCHEMAS ============
const produtoSchema = z.object({
    tipo: z.string().min(1, 'Tipo obrigatório'),
    categoria_id: z.string().optional(),
    nova_categoria: z.string().optional(),
    descricao: z.string().min(3, 'Descrição obrigatória')
});

const loteSchema = z.object({
    quantidade: z.coerce.number().min(1, 'Mínimo 1'),
    data_entrada: z.string().min(1, 'Data obrigatória')
});

const entregaSchema = z.object({
    tipo: z.string().min(1, 'Tipo obrigatório'),
    categoria_id: z.string().min(1, 'Categoria obrigatória'),
    produto_id: z.string().min(1, 'Produto obrigatório'),
    quantidade: z.coerce.number().min(1, 'Mínimo 1'),
    data_movimentacao: z.string().min(1, 'Data obrigatória'),
    funcionario_id: z.string().optional(),
    contrato_id: z.string().optional()
});

const devolucaoSchema = z.object({
    tipo: z.string().min(1, 'Tipo obrigatório'),
    funcionario_id: z.string().optional(),
    contrato_id: z.string().optional(),
    produto_id: z.string().min(1, 'Produto obrigatório'),
    quantidade: z.coerce.number().min(1, 'Mínimo 1'),
    data_movimentacao: z.string().min(1, 'Data obrigatória')
});

const descarteSchema = z.object({
    quantidade: z.coerce.number().min(1, 'Mínimo 1'),
    data_movimentacao: z.string().min(1, 'Data obrigatória'),
    motivo: z.string().min(3, 'Motivo obrigatório')
});

export default function ControleEstoque() {
    const { addToast } = useToast();
    const today = format(new Date(), 'yyyy-MM-dd');

    // Data
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [movIndividuais, setMovIndividuais] = useState([]);
    const [movColetivas, setMovColetivas] = useState([]);
    const [funcionarios, setFuncionarios] = useState([]);
    const [contratos, setContratos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Tabs & Filters
    const [activeTab, setActiveTab] = useState('estoque');
    const [searchTerm, setSearchTerm] = useState('');
    const [tipoFilter, setTipoFilter] = useState('all');

    // Modals
    const [confirmProdutoOpen, setConfirmProdutoOpen] = useState(false);
    const [produtoModalOpen, setProdutoModalOpen] = useState(false);
    const [loteModalOpen, setLoteModalOpen] = useState(false);
    const [entregaModalOpen, setEntregaModalOpen] = useState(false);
    const [devolucaoModalOpen, setDevolucaoModalOpen] = useState(false);
    const [descarteModalOpen, setDescarteModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Edit states
    const [selectedProduto, setSelectedProduto] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [produtosPossui, setProdutosPossui] = useState([]);
    const [showNovaCategoria, setShowNovaCategoria] = useState(false);

    // Forms
    const produtoForm = useForm({ resolver: zodResolver(produtoSchema) });
    const loteForm = useForm({ resolver: zodResolver(loteSchema), defaultValues: { data_entrada: today } });
    const entregaForm = useForm({ resolver: zodResolver(entregaSchema), defaultValues: { data_movimentacao: today } });
    const devolucaoForm = useForm({ resolver: zodResolver(devolucaoSchema), defaultValues: { data_movimentacao: today } });
    const descarteForm = useForm({ resolver: zodResolver(descarteSchema), defaultValues: { data_movimentacao: today } });

    const tipoWatch = produtoForm.watch('tipo');
    const entregaTipoWatch = entregaForm.watch('tipo');
    const entregaCategoriaWatch = entregaForm.watch('categoria_id');
    const devolucaoTipoWatch = devolucaoForm.watch('tipo');
    const devolucaoFuncWatch = devolucaoForm.watch('funcionario_id');
    const devolucaoContratoWatch = devolucaoForm.watch('contrato_id');

    // Fetch
    const fetchData = async () => {
        try {
            setLoading(true);
            const [prods, cats, movI, movC, funcs, conts] = await Promise.all([
                estoqueService.getProdutosComEstoque(),
                estoqueService.getCategorias(),
                estoqueService.getMovimentacoesIndividuais(),
                estoqueService.getMovimentacoesColetivas(),
                funcionariosService.getAll(),
                contratosService.getAll()
            ]);
            setProdutos(prods);
            setCategorias(cats);
            setMovIndividuais(movI);
            setMovColetivas(movC);
            setFuncionarios(funcs.filter(f => f.ativo));
            setContratos(conts.filter(c => c.ativo));
        } catch (err) {
            console.error(err);
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao carregar dados.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Filtered data
    const filteredProdutos = produtos
        .filter(p => tipoFilter === 'all' || p.estoque_categorias?.tipo === tipoFilter)
        .filter(p =>
            p.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.estoque_categorias?.nome.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const categoriasFiltradas = categorias.filter(c => c.tipo === tipoWatch);
    const categoriasEntrega = categorias.filter(c => c.tipo === entregaTipoWatch);
    const produtosEntrega = produtos.filter(p =>
        p.estoque_categorias?.id === entregaCategoriaWatch && p.quantidade_disponivel > 0
    );

    // Filtro para movimentações individuais (inclui funcionário e produto)
    const filteredMovIndividuais = movIndividuais.filter(mov =>
        mov.estoque_produtos?.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.funcionarios?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filtro para movimentações coletivas (inclui posto e produto)
    const filteredMovColetivas = movColetivas.filter(mov =>
        mov.estoque_produtos?.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.contratos?.posto_trabalho?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ============ HANDLERS: PRODUTO ============
    const handleCadastrarProduto = () => setConfirmProdutoOpen(true);

    const handleConfirmProduto = () => {
        setConfirmProdutoOpen(false);
        setIsEditMode(false);
        setSelectedProduto(null);
        setShowNovaCategoria(false);
        produtoForm.reset({ tipo: '', categoria_id: '', nova_categoria: '', descricao: '' });
        setProdutoModalOpen(true);
    };

    const handleEditProduto = (prod) => {
        setSelectedProduto(prod);
        setIsEditMode(true);
        produtoForm.reset({
            tipo: prod.estoque_categorias?.tipo || '',
            categoria_id: prod.categoria_id,
            nova_categoria: '',
            descricao: prod.descricao
        });
        setProdutoModalOpen(true);
    };

    const handleViewProduto = (prod) => {
        setSelectedProduto(prod);
        setViewModalOpen(true);
    };

    const handleDeleteProduto = (prod) => {
        setSelectedProduto(prod);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await estoqueService.deleteProduto(selectedProduto.id);
            addToast({ type: 'success', title: 'Sucesso', message: 'Produto excluído.' });
            fetchData();
        } catch (err) {
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao excluir.' });
        } finally {
            setDeleteModalOpen(false);
        }
    };

    const onSubmitProduto = async (data) => {
        try {
            let categoriaId = data.categoria_id;
            if (data.nova_categoria) {
                const novaCat = await estoqueService.createCategoria(data.nova_categoria, data.tipo);
                categoriaId = novaCat.id;
            }
            if (!categoriaId) throw new Error('Selecione ou crie uma categoria');

            if (isEditMode) {
                await estoqueService.updateProduto(selectedProduto.id, { categoria_id: categoriaId, descricao: data.descricao });
                addToast({ type: 'success', title: 'Sucesso', message: 'Produto atualizado.' });
            } else {
                await estoqueService.createProduto(categoriaId, data.descricao);
                addToast({ type: 'success', title: 'Sucesso', message: 'Produto cadastrado.' });
            }
            setProdutoModalOpen(false);
            fetchData();
        } catch (err) {
            addToast({ type: 'error', title: 'Erro', message: err.message || 'Erro ao salvar.' });
        }
    };

    // ============ HANDLERS: LOTE ============
    const handleCadastrarLote = (prod) => {
        setSelectedProduto(prod);
        loteForm.reset({ quantidade: 1, data_entrada: today });
        setLoteModalOpen(true);
    };

    const onSubmitLote = async (data) => {
        try {
            await estoqueService.createLote(selectedProduto.id, data.quantidade, data.data_entrada);
            addToast({ type: 'success', title: 'Sucesso', message: 'Lote cadastrado.' });
            setLoteModalOpen(false);
            fetchData();
        } catch (err) {
            addToast({ type: 'error', title: 'Erro', message: err.message || 'Erro ao cadastrar lote.' });
        }
    };

    // ============ HANDLERS: ENTREGA ============
    const handleEntregar = () => {
        entregaForm.reset({ tipo: '', categoria_id: '', produto_id: '', quantidade: 1, data_movimentacao: today, funcionario_id: '', contrato_id: '' });
        setEntregaModalOpen(true);
    };

    const onSubmitEntrega = async (data) => {
        try {
            await estoqueService.entregar(
                data.produto_id,
                data.quantidade,
                data.data_movimentacao,
                data.tipo === 'Individual' ? data.funcionario_id : null,
                data.tipo === 'Coletivo' ? data.contrato_id : null
            );
            addToast({ type: 'success', title: 'Sucesso', message: 'Equipamento entregue.' });
            setEntregaModalOpen(false);
            fetchData();
        } catch (err) {
            addToast({ type: 'error', title: 'Erro', message: err.message || 'Erro ao entregar.' });
        }
    };

    // ============ HANDLERS: DEVOLUÇÃO ============
    const handleDevolver = () => {
        devolucaoForm.reset({ tipo: '', funcionario_id: '', contrato_id: '', produto_id: '', quantidade: 1, data_movimentacao: today });
        setProdutosPossui([]);
        setDevolucaoModalOpen(true);
    };

    const fetchProdutosPossui = async () => {
        try {
            const prods = await estoqueService.getProdutosPossui(
                devolucaoTipoWatch === 'Individual' ? devolucaoFuncWatch : null,
                devolucaoTipoWatch === 'Coletivo' ? devolucaoContratoWatch : null
            );
            setProdutosPossui(prods);
        } catch { setProdutosPossui([]); }
    };

    useEffect(() => {
        if ((devolucaoTipoWatch === 'Individual' && devolucaoFuncWatch) ||
            (devolucaoTipoWatch === 'Coletivo' && devolucaoContratoWatch)) {
            fetchProdutosPossui();
        } else {
            setProdutosPossui([]);
        }
    }, [devolucaoTipoWatch, devolucaoFuncWatch, devolucaoContratoWatch]);

    const onSubmitDevolucao = async (data) => {
        try {
            await estoqueService.devolver(
                data.produto_id,
                data.quantidade,
                data.data_movimentacao,
                data.tipo === 'Individual' ? data.funcionario_id : null,
                data.tipo === 'Coletivo' ? data.contrato_id : null
            );
            addToast({ type: 'success', title: 'Sucesso', message: 'Equipamento devolvido.' });
            setDevolucaoModalOpen(false);
            fetchData();
        } catch (err) {
            addToast({ type: 'error', title: 'Erro', message: err.message || 'Erro ao devolver.' });
        }
    };

    // ============ HANDLERS: DESCARTE ============
    const handleDescartar = (prod) => {
        setSelectedProduto(prod);
        descarteForm.reset({ quantidade: 1, data_movimentacao: today, motivo: '' });
        setDescarteModalOpen(true);
    };

    const onSubmitDescarte = async (data) => {
        try {
            await estoqueService.descartar(selectedProduto.id, data.quantidade, data.data_movimentacao, data.motivo);
            addToast({ type: 'success', title: 'Sucesso', message: 'Descarte registrado.' });
            setDescarteModalOpen(false);
            fetchData();
        } catch (err) {
            addToast({ type: 'error', title: 'Erro', message: err.message || 'Erro ao descartar.' });
        }
    };

    // ============ RENDER ============
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Controle de Estoque</h1>
                    <p className="text-slate-500">Gestão de equipamentos individuais e coletivos</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={handleCadastrarProduto} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        <Plus size={20} /> Cadastrar Produto
                    </button>
                    <button onClick={handleEntregar} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        <Send size={20} /> Entregar
                    </button>
                    <button onClick={handleDevolver} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        <RotateCcw size={20} /> Devolver
                    </button>
                </div>
            </div>

            {/* Filters - Card branco separado igual Recebimentos */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar produto ou categoria..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600 whitespace-nowrap">Tipo:</label>
                    <select
                        value={tipoFilter}
                        onChange={(e) => setTipoFilter(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option value="all">Todos</option>
                        <option value="Individual">Individual</option>
                        <option value="Coletivo">Coletivo</option>
                    </select>
                </div>
            </div>

            {/* Tabs - Separadas do filtro */}
            <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {['estoque', 'individuais', 'coletivos'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={clsx(
                            "flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                            activeTab === tab
                                ? 'text-blue-600 border-blue-600 bg-blue-50/50'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border-transparent'
                        )}
                    >
                        {tab === 'estoque' ? 'Estoque' : tab === 'individuais' ? 'Equip. Individuais' : 'Equip. Coletivos'}
                    </button>
                ))}
            </div>

            {/* Content - Container separado */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {activeTab === 'estoque' && (
                    <>
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Produto</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Categoria</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Qtd Disponível</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Último Lote</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {loading ? (
                                        <tr><td colSpan="6" className="p-8 text-center text-slate-500">Carregando...</td></tr>
                                    ) : filteredProdutos.length === 0 ? (
                                        <tr><td colSpan="6" className="p-8 text-center text-slate-500">Nenhum produto encontrado</td></tr>
                                    ) : (
                                        filteredProdutos.map(prod => (
                                            <tr
                                                key={prod.id}
                                                onClick={() => handleViewProduto(prod)}
                                                className={clsx(
                                                    "hover:bg-slate-50 transition-colors cursor-pointer border-l-4",
                                                    prod.estoque_categorias?.tipo === 'Individual' ? 'border-l-blue-500' : 'border-l-emerald-500'
                                                )}
                                            >
                                                <td className="px-6 py-4 font-medium text-slate-900">{prod.descricao}</td>
                                                <td className="px-6 py-4 text-slate-600">{prod.estoque_categorias?.nome}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={clsx("font-bold", prod.quantidade_disponivel > 0 ? 'text-emerald-600' : 'text-red-600')}>
                                                        {prod.quantidade_disponivel}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={clsx(
                                                        "px-2 py-1 rounded text-xs font-medium",
                                                        prod.estoque_categorias?.tipo === 'Individual' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                                    )}>
                                                        {prod.estoque_categorias?.tipo}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{prod.ultimo_lote ? format(parseISO(prod.ultimo_lote.split('T')[0]), 'dd/MM/yyyy') : '-'}</td>
                                                <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                    <div className="flex justify-end gap-1">
                                                        <button onClick={() => handleViewProduto(prod)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Eye size={16} /></button>
                                                        <button onClick={() => handleCadastrarLote(prod)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Cadastrar Lote"><PackagePlus size={16} /></button>
                                                        <button onClick={() => handleDescartar(prod)} disabled={prod.quantidade_disponivel === 0} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded disabled:opacity-30" title="Descartar"><Recycle size={16} /></button>
                                                        <button onClick={() => handleEditProduto(prod)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil size={16} /></button>
                                                        <button onClick={() => handleDeleteProduto(prod)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4 p-4">
                            {loading ? <p className="text-center text-slate-500">Carregando...</p> : filteredProdutos.length === 0 ? <p className="text-center text-slate-500">Nenhum produto</p> : (
                                filteredProdutos.map(prod => (
                                    <div key={prod.id} onClick={() => handleViewProduto(prod)} className={clsx("bg-white p-4 rounded-lg shadow-sm border-l-4 cursor-pointer space-y-2", prod.estoque_categorias?.tipo === 'Individual' ? 'border-l-blue-500' : 'border-l-emerald-500')}>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-slate-900">{prod.descricao}</h3>
                                                <p className="text-sm text-slate-500">{prod.estoque_categorias?.nome}</p>
                                            </div>
                                            <span className={clsx("font-bold text-lg", prod.quantidade_disponivel > 0 ? 'text-emerald-600' : 'text-red-600')}>{prod.quantidade_disponivel}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                            <span className={clsx(
                                                "px-2 py-0.5 rounded text-xs font-medium",
                                                prod.estoque_categorias?.tipo === 'Individual' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                            )}>
                                                {prod.estoque_categorias?.tipo}
                                            </span>
                                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                                <button onClick={() => handleCadastrarLote(prod)} className="p-1.5 text-slate-400 hover:text-emerald-600"><PackagePlus size={16} /></button>
                                                <button onClick={() => handleEditProduto(prod)} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'individuais' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Data</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Produto</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Quantidade</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Funcionário</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredMovIndividuais.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">Nenhuma movimentação</td></tr>
                                ) : filteredMovIndividuais.map(mov => (
                                    <tr key={mov.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm text-slate-600">{format(parseISO(mov.data_movimentacao.split('T')[0]), 'dd/MM/yyyy')}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{mov.estoque_produtos?.descricao}</td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-900">{mov.quantidade}</td>
                                        <td className="px-6 py-4 text-slate-600">{mov.funcionarios?.nome}</td>
                                        <td className="px-6 py-4">
                                            <span className={clsx("px-2 py-1 rounded text-xs font-medium",
                                                mov.tipo_mov === 'Entrega' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            )}>{mov.tipo_mov}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'coletivos' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Data</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Produto</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Quantidade</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Posto de Trabalho</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Tipo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredMovColetivas.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">Nenhuma movimentação</td></tr>
                                ) : filteredMovColetivas.map(mov => (
                                    <tr key={mov.id} className={clsx("hover:bg-slate-50 border-l-4", getBorderColor(mov.contratos?.empresas?.nome_empresa))}>
                                        <td className="px-6 py-4 text-sm text-slate-600">{format(parseISO(mov.data_movimentacao.split('T')[0]), 'dd/MM/yyyy')}</td>
                                        <td className="px-6 py-4 font-medium text-slate-900">{mov.estoque_produtos?.descricao}</td>
                                        <td className="px-6 py-4 text-center font-bold text-slate-900">{mov.quantidade}</td>
                                        <td className="px-6 py-4 text-slate-600">{mov.contratos?.posto_trabalho}</td>
                                        <td className="px-6 py-4">
                                            <span className={clsx("px-2 py-1 rounded text-xs font-medium",
                                                mov.tipo_mov === 'Entrega' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            )}>{mov.tipo_mov}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal: Confirmação Produto */}
            <ConfirmationModal
                isOpen={confirmProdutoOpen}
                onCancel={() => setConfirmProdutoOpen(false)}
                onConfirm={handleConfirmProduto}
                title="Cadastrar Produto"
                message="Verifique se o produto já existe ou se não quer apenas adicionar um lote."
                confirmText="Continuar"
            />

            {/* Modal: Produto */}
            {produtoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900">{isEditMode ? 'Editar Produto' : 'Novo Produto'}</h2>
                            <button onClick={() => setProdutoModalOpen(false)} className="text-slate-400 hover:text-slate-600"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <form onSubmit={produtoForm.handleSubmit(onSubmitProduto)} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Tipo *</label>
                                <select {...produtoForm.register('tipo')} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                                    <option value="">Selecione...</option>
                                    <option value="Individual">Individual</option>
                                    <option value="Coletivo">Coletivo</option>
                                </select>
                            </div>
                            {tipoWatch && (
                                <>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-slate-700">Categoria *</label>
                                            <button
                                                type="button"
                                                onClick={() => setShowNovaCategoria(!showNovaCategoria)}
                                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                title="Criar nova categoria"
                                            >
                                                <Plus size={14} /> Nova
                                            </button>
                                        </div>
                                        <select {...produtoForm.register('categoria_id')} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                                            <option value="">Selecione...</option>
                                            {categoriasFiltradas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                        </select>
                                    </div>
                                    {showNovaCategoria && (
                                        <div className="space-y-1.5 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                            <label className="text-sm font-medium text-blue-700">Nova categoria</label>
                                            <input type="text" {...produtoForm.register('nova_categoria')} placeholder="Nome da categoria" className="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white" />
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Descrição *</label>
                                <input type="text" {...produtoForm.register('descricao')} placeholder="Ex: CAMISA POLO FEMOG AZUL M" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                {produtoForm.formState.errors.descricao && <span className="text-xs text-red-500">{produtoForm.formState.errors.descricao.message}</span>}
                            </div>
                            <div className="pt-4 border-t flex justify-end gap-3">
                                <button type="button" onClick={() => setProdutoModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Lote */}
            {loteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900">Cadastrar Lote</h2>
                            <button onClick={() => setLoteModalOpen(false)} className="text-slate-400 hover:text-slate-600"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <form onSubmit={loteForm.handleSubmit(onSubmitLote)} className="p-6 space-y-4">
                            <p className="text-sm text-slate-600"><strong>Produto:</strong> {selectedProduto?.descricao}</p>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Quantidade *</label>
                                <input type="number" min="1" {...loteForm.register('quantidade')} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Data de Entrada *</label>
                                <input type="date" {...loteForm.register('data_entrada')} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                            </div>
                            <div className="pt-4 border-t flex justify-end gap-3">
                                <button type="button" onClick={() => setLoteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Cadastrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Entrega */}
            {entregaModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                        <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900">Entregar Equipamento</h2>
                            <button onClick={() => setEntregaModalOpen(false)} className="text-slate-400 hover:text-slate-600"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <form onSubmit={entregaForm.handleSubmit(onSubmitEntrega)} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Tipo *</label>
                                    <select {...entregaForm.register('tipo')} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                                        <option value="">Selecione...</option>
                                        <option value="Individual">Individual</option>
                                        <option value="Coletivo">Coletivo</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Categoria *</label>
                                    <select {...entregaForm.register('categoria_id')} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                                        <option value="">Selecione...</option>
                                        {categoriasEntrega.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Produto *</label>
                                <select {...entregaForm.register('produto_id')} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                                    <option value="">Selecione...</option>
                                    {produtosEntrega.map(p => <option key={p.id} value={p.id}>{p.descricao} (Disp: {p.quantidade_disponivel})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Quantidade *</label>
                                    <input type="number" min="1" {...entregaForm.register('quantidade')} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Data *</label>
                                    <input type="date" {...entregaForm.register('data_movimentacao')} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                            </div>
                            {entregaTipoWatch === 'Individual' && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Funcionário *</label>
                                    <select {...entregaForm.register('funcionario_id')} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                                        <option value="">Selecione...</option>
                                        {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                                    </select>
                                </div>
                            )}
                            {entregaTipoWatch === 'Coletivo' && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Posto de Trabalho *</label>
                                    <select {...entregaForm.register('contrato_id')} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                                        <option value="">Selecione...</option>
                                        {contratos.map(c => <option key={c.id} value={c.id}>{c.posto_trabalho}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="pt-4 border-t flex justify-end gap-3">
                                <button type="button" onClick={() => setEntregaModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Entregar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Devolução */}
            {devolucaoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                        <div className="px-6 py-4 border-b border-slate-100 bg-amber-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900">Devolver Equipamento</h2>
                            <button onClick={() => setDevolucaoModalOpen(false)} className="text-slate-400 hover:text-slate-600"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <form onSubmit={devolucaoForm.handleSubmit(onSubmitDevolucao)} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Tipo *</label>
                                <select {...devolucaoForm.register('tipo')} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                                    <option value="">Selecione...</option>
                                    <option value="Individual">Individual</option>
                                    <option value="Coletivo">Coletivo</option>
                                </select>
                            </div>
                            {devolucaoTipoWatch === 'Individual' && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Funcionário *</label>
                                    <select {...devolucaoForm.register('funcionario_id')} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                                        <option value="">Selecione...</option>
                                        {funcionarios.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                                    </select>
                                </div>
                            )}
                            {devolucaoTipoWatch === 'Coletivo' && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Posto de Trabalho *</label>
                                    <select {...devolucaoForm.register('contrato_id')} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                                        <option value="">Selecione...</option>
                                        {contratos.map(c => <option key={c.id} value={c.id}>{c.posto_trabalho}</option>)}
                                    </select>
                                </div>
                            )}
                            {produtosPossui.length > 0 && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Produto *</label>
                                        <select {...devolucaoForm.register('produto_id')} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                                            <option value="">Selecione...</option>
                                            {produtosPossui.map(p => <option key={p.id} value={p.id}>{p.descricao} (Possui: {p.quantidade_possui})</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700">Quantidade *</label>
                                            <input type="number" min="1" {...devolucaoForm.register('quantidade')} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-slate-700">Data *</label>
                                            <input type="date" {...devolucaoForm.register('data_movimentacao')} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                        </div>
                                    </div>
                                </>
                            )}
                            {produtosPossui.length === 0 && (devolucaoFuncWatch || devolucaoContratoWatch) && (
                                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded">Nenhum produto para devolver.</p>
                            )}
                            <div className="pt-4 border-t flex justify-end gap-3">
                                <button type="button" onClick={() => setDevolucaoModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
                                <button type="submit" disabled={produtosPossui.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50">Devolver</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Descarte */}
            {descarteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-slate-100 bg-red-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900">Descartar Equipamento</h2>
                            <button onClick={() => setDescarteModalOpen(false)} className="text-slate-400 hover:text-slate-600"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <form onSubmit={descarteForm.handleSubmit(onSubmitDescarte)} className="p-6 space-y-4">
                            <p className="text-sm text-slate-600"><strong>Produto:</strong> {selectedProduto?.descricao}</p>
                            <p className="text-sm text-slate-600"><strong>Disponível:</strong> {selectedProduto?.quantidade_disponivel}</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Quantidade *</label>
                                    <input type="number" min="1" max={selectedProduto?.quantidade_disponivel} {...descarteForm.register('quantidade')} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Data *</label>
                                    <input type="date" {...descarteForm.register('data_movimentacao')} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Motivo *</label>
                                <textarea {...descarteForm.register('motivo')} rows={3} placeholder="Informe o motivo do descarte" className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none" />
                                {descarteForm.formState.errors.motivo && <span className="text-xs text-red-500">{descarteForm.formState.errors.motivo.message}</span>}
                            </div>
                            <div className="pt-4 border-t flex justify-end gap-3">
                                <button type="button" onClick={() => setDescarteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Descartar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: View */}
            {viewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900">Detalhes do Produto</h2>
                            <button onClick={() => setViewModalOpen(false)} className="text-slate-400 hover:text-slate-600"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="p-6 space-y-3">
                            <p><strong>Descrição:</strong> {selectedProduto?.descricao}</p>
                            <p><strong>Categoria:</strong> {selectedProduto?.estoque_categorias?.nome}</p>
                            <p><strong>Tipo:</strong> {selectedProduto?.estoque_categorias?.tipo}</p>
                            <p><strong>Qtd Disponível:</strong> {selectedProduto?.quantidade_disponivel}</p>
                            <p><strong>Último Lote:</strong> {selectedProduto?.ultimo_lote ? format(new Date(selectedProduto.ultimo_lote), 'dd/MM/yyyy') : '-'}</p>
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3">
                            <button onClick={() => setViewModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Fechar</button>
                            <button onClick={() => { setViewModalOpen(false); handleEditProduto(selectedProduto); }} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Editar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onCancel={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Excluir Produto"
                message={`Tem certeza que deseja excluir "${selectedProduto?.descricao}"?`}
            />
        </div>
    );
}
