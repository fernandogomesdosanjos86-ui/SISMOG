import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import {
    Search, Plus, Filter, Box, User, Briefcase, ArrowRight,
    CornerDownLeft, Save, X, Trash2, AlertCircle, CheckCircle,
    Package, Layers, AlertTriangle, History, Info
} from 'lucide-react';

// --- ESTILOS AUXILIARES (DNA VISUAL SISMOG) ---
// Ajuste: Adicionado px-4 para resolver o espaçamento do texto
const INPUT_STYLE = "w-full bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-base h-[48px] px-4";
const MODAL_OVERLAY = "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity";
const MODAL_CONTENT = "bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto";

const ControleEstoque = () => {
    // --- ESTADOS DE DADOS ---
    const [produtos, setProdutos] = useState([]);
    const [movimentacoes, setMovimentacoes] = useState([]); // Histórico completo para cálculos
    const [funcionarios, setFuncionarios] = useState([]);
    const [postos, setPostos] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- ESTADOS DE UI/FILTROS ---
    const [activeTab, setActiveTab] = useState('VISAO_GERAL');
    const [subFilterTipo, setSubFilterTipo] = useState('Individual');
    const [searchTerm, setSearchTerm] = useState('');

    // --- ESTADOS DE MODAL E FORMULÁRIO ---
    const [modalMode, setModalMode] = useState(null);
    const [feedbackModal, setFeedbackModal] = useState({ open: false, type: 'success', title: '', message: '' });

    // Filtros Auxiliares do Modal de Movimentação
    const [moveFilters, setMoveFilters] = useState({
        tipo: 'Individual', // Individual ou Coletivo
        categoria: '',
        entityId: '' // ID do Funcionário ou Posto (usado na Devolução)
    });

    const [formProduto, setFormProduto] = useState({
        tipo: 'Individual', categoria: '', nome: '', variacao: '', estoque_minimo: 5
    });

    const [formMovimento, setFormMovimento] = useState({
        produto_id: '',
        tipo_movimento: 'ENTREGAR',
        quantidade: 1,
        data_movimento: new Date().toISOString().slice(0, 10),
        empresa_destino: 'Femog',
        funcionario_id: '',
        posto_trabalho_id: '',
        observacao: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, movRes, funcRes, postosRes] = await Promise.all([
                supabase.from('estoque_produtos').select('*').order('nome'),
                // Removemos o limit para garantir cálculo correto de posse
                supabase.from('estoque_movimentacoes').select(`
                    *,
                    estoque_produtos (nome, codigo_ref, variacao, tipo, categoria),
                    funcionarios (nome),
                    postos_trabalho (nome_posto)
                `).order('data_movimento', { ascending: false }),
                supabase.from('funcionarios').select('id, nome, empresas(nome)').order('nome'),
                supabase.from('postos_trabalho').select('id, nome_posto').eq('ativo', true).order('nome_posto')
            ]);

            if (prodRes.error) throw prodRes.error;

            setProdutos(prodRes.data || []);
            setMovimentacoes(movRes.data || []);
            setFuncionarios(funcRes.data || []);
            setPostos(postosRes.data || []);

        } catch (error) {
            console.error(error);
            showFeedback('error', 'Erro ao carregar', error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- HELPERS DE CÁLCULO ---
    const generateRefCode = (name) => {
        // Gera um código automático ex: UNI-8392
        const prefix = name ? name.substring(0, 3).toUpperCase() : 'PROD';
        const random = Math.floor(1000 + Math.random() * 9000);
        return `${prefix}-${random}`;
    };

    const getStockInfo = (prodId) => {
        const prod = produtos.find(p => p.id === prodId);
        if (!prod) return null;
        return { base: prod.estoque_base, em_uso: prod.estoque_em_uso };
    };

    // Calcula o que um funcionário/posto tem em mãos baseado no histórico
    const getEntityPossession = (entityId, isFuncionario) => {
        const items = {};
        movimentacoes.forEach(m => {
            const isTarget = isFuncionario ? m.funcionario_id === entityId : m.posto_trabalho_id === entityId;
            if (isTarget) {
                if (!items[m.produto_id]) items[m.produto_id] = 0;
                if (m.tipo_movimento === 'ENTREGAR') items[m.produto_id] += m.quantidade;
                if (m.tipo_movimento === 'DEVOLVER') items[m.produto_id] -= m.quantidade;
            }
        });
        // Retorna array de produtos com saldo positivo
        return Object.keys(items)
            .filter(prodId => items[prodId] > 0)
            .map(prodId => ({
                id: prodId,
                qtd: items[prodId],
                details: produtos.find(p => p.id === prodId)
            }));
    };

    const resetForms = () => {
        setFormProduto({ tipo: 'Individual', categoria: '', nome: '', variacao: '', estoque_minimo: 5 });
        setFormMovimento({
            produto_id: '', tipo_movimento: 'ENTREGAR', quantidade: 1,
            data_movimento: new Date().toISOString().slice(0, 10),
            empresa_destino: 'Femog', funcionario_id: '', posto_trabalho_id: '', observacao: ''
        });
        setMoveFilters({ tipo: 'Individual', categoria: '', entityId: '' });
    };

    // --- HANDLERS ---
    const handleSaveProduto = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formProduto,
                codigo_ref: generateRefCode(formProduto.nome) // Código Automático
            };

            const { error } = await supabase.from('estoque_produtos').insert([payload]);
            if (error) throw error;

            showFeedback('success', 'Produto Cadastrado', `O item ${formProduto.nome} foi criado.`);
            setModalMode(null);
            resetForms(); // Limpa formulário
            fetchData();
        } catch (error) {
            showFeedback('error', 'Erro', error.message);
        }
    };

    const handleSaveMovimento = async (e) => {
        e.preventDefault();
        try {
            const produtoSelecionado = produtos.find(p => p.id === formMovimento.produto_id);
            if (!produtoSelecionado) throw new Error("Selecione um produto.");

            const qtd = parseInt(formMovimento.quantidade);
            if (qtd <= 0) throw new Error("Quantidade deve ser maior que zero.");

            // Validações de Estoque

            // 1. Validação para ENTREGA (Saída padrão)
            if (formMovimento.tipo_movimento === 'ENTREGAR') {
                if (produtoSelecionado.estoque_base < qtd) {
                    throw new Error(`Saldo insuficiente na Base para realizar a entrega. Disponível: ${produtoSelecionado.estoque_base}`);
                }
            }

            // 2. Validação para DESCARTE (Novo aviso padronizado)
            if (formMovimento.tipo_movimento === 'DESCARTAR_LOTE') {
                if (produtoSelecionado.estoque_base < qtd) {
                    throw new Error(`Não é possível descartar uma quantidade maior que o estoque atual. Disponível: ${produtoSelecionado.estoque_base}`);
                }
            }

            // 3. Validação para DEVOLUÇÃO (Retorno ao estoque)
            if (formMovimento.tipo_movimento === 'DEVOLVER') {
                // Verificar se a pessoa realmente tem esse item
                const entityId = produtoSelecionado.tipo === 'Individual' ? formMovimento.funcionario_id : formMovimento.posto_trabalho_id;
                const isFunc = produtoSelecionado.tipo === 'Individual';
                const possession = getEntityPossession(entityId, isFunc).find(i => i.id === formMovimento.produto_id);

                if (!possession || possession.qtd < qtd) {
                    throw new Error(`O funcionário/posto não possui essa quantidade para devolver. Em posse: ${possession ? possession.qtd : 0}`);
                }
            }

            const payload = {
                produto_id: formMovimento.produto_id,
                tipo_movimento: formMovimento.tipo_movimento,
                quantidade: qtd,
                data_movimento: formMovimento.data_movimento,
                observacao: formMovimento.observacao,
                empresa_destino: formMovimento.empresa_destino
            };

            if (formMovimento.tipo_movimento === 'ENTREGAR' || formMovimento.tipo_movimento === 'DEVOLVER') {
                if (produtoSelecionado.tipo === 'Individual') {
                    if (!formMovimento.funcionario_id) throw new Error("Selecione o Funcionário.");
                    payload.funcionario_id = formMovimento.funcionario_id;
                    payload.posto_trabalho_id = null;
                } else {
                    if (!formMovimento.posto_trabalho_id) throw new Error("Selecione o Posto de Trabalho.");
                    payload.posto_trabalho_id = formMovimento.posto_trabalho_id;
                    payload.funcionario_id = null;
                }
            }

            const { error } = await supabase.from('estoque_movimentacoes').insert([payload]);
            if (error) throw error;

            showFeedback('success', 'Movimentação Realizada', 'Estoque atualizado com sucesso.');
            setModalMode(null);
            resetForms(); // Limpa formulário
            fetchData();
        } catch (error) {
            showFeedback('error', 'Erro na Operação', error.message);
        }
    };

    const showFeedback = (type, title, message) => {
        setFeedbackModal({ open: true, type, title, message });
    };

    // --- FILTROS DE LISTAGEM ---
    const getUniqueCategories = (tipo) => {
        return [...new Set(produtos.filter(p => p.tipo === tipo).map(p => p.categoria))];
    };

    const produtosFiltrados = produtos.filter(p => {
        const matchSearch = (p.nome + p.categoria).toLowerCase().includes(searchTerm.toLowerCase());
        const matchType = p.tipo === subFilterTipo;
        return matchSearch && matchType;
    });

    const movimentacoesFiltradas = movimentacoes.filter(m => {
        const prod = produtos.find(p => p.id === m.produto_id);
        const matchType = prod ? prod.tipo === subFilterTipo : true;
        const matchSearch = (m.estoque_produtos?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.funcionarios?.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.postos_trabalho?.nome_posto || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchType && matchSearch;
    });

    const getStripColor = (empresa, categoria) => {
        if (empresa?.toLowerCase().includes('femog')) return '#2563eb';
        if (empresa?.toLowerCase().includes('semog')) return '#f97316';
        if (categoria?.toLowerCase().includes('radio')) return '#f59e0b';
        if (categoria?.toLowerCase().includes('camisa')) return '#3b82f6';
        return '#9ca3af';
    };

    const renderCamposDestino = () => {
        return (
            <>
                {moveFilters.tipo === 'Individual' ? (
                    <div className="space-y-4">
                        {/* Campo de Empresa adicionado para filtrar Funcionários */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Empresa do Funcionário</label>
                            <select
                                className={INPUT_STYLE}
                                value={formMovimento.empresa_destino}
                                onChange={e => setFormMovimento({ ...formMovimento, empresa_destino: e.target.value })}
                            >
                                <option value="Femog">Femog</option>
                                <option value="Semog">Semog</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Funcionário Destino</label>
                            <select
                                required
                                className={INPUT_STYLE}
                                value={formMovimento.funcionario_id}
                                onChange={e => setFormMovimento({ ...formMovimento, funcionario_id: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {funcionarios
                                    .filter(f => f.empresas?.nome?.includes(formMovimento.empresa_destino))
                                    .map(f => (
                                        <option key={f.id} value={f.id}>{f.nome}</option>
                                    ))}
                            </select>
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Posto Destino</label>
                        <select
                            required
                            className={INPUT_STYLE}
                            value={formMovimento.posto_trabalho_id}
                            onChange={e => setFormMovimento({ ...formMovimento, posto_trabalho_id: e.target.value })}
                        >
                            <option value="">Selecione...</option>
                            {postos.map(p => (
                                <option key={p.id} value={p.id}>{p.nome_posto}</option>
                            ))}
                        </select>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="flex min-h-screen bg-gray-100 font-sans">
            <Sidebar />
            <div className="ml-0 md:ml-72 transition-all duration-300 flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden text-slate-900">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* HEADER */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Package className="text-blue-600" /> Controle de Estoque
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">Gestão de Materiais Individuais e Coletivos</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    resetForms(); // Garante estado limpo
                                    setFormMovimento(prev => ({ ...prev, tipo_movimento: 'ENTREGAR' }));
                                    setModalMode('MOVIMENTAR');
                                }}
                                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-lg shadow-sm font-medium text-sm flex items-center gap-2"
                            >
                                <ArrowRight size={18} /> Movimentar
                            </button>
                            <button
                                onClick={() => {
                                    resetForms();
                                    setModalMode('ADD_PRODUTO');
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-lg shadow-blue-500/20 font-medium text-sm flex items-center gap-2"
                            >
                                <Plus size={18} /> Novo Produto
                            </button>
                        </div>
                    </div>

                    {/* ABAS SUPERIORES */}
                    <div className="flex bg-slate-200/50 p-1.5 rounded-xl w-fit border border-slate-200/60 shadow-inner">
                        <button
                            onClick={() => setActiveTab('VISAO_GERAL')}
                            className={`px-6 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'VISAO_GERAL'
                                ? 'bg-white shadow-md text-blue-600 border border-slate-100'
                                : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Layers size={14} /> VISÃO GERAL
                        </button>
                        <button
                            onClick={() => setActiveTab('HISTORICO')}
                            className={`px-6 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'HISTORICO'
                                ? 'bg-white shadow-md text-blue-600 border border-slate-100'
                                : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <History size={14} /> HISTÓRICO
                        </button>
                    </div>

                    {/* BARRA DE FILTROS */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                        <div className="relative w-full md:w-[40%]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                            <input
                                type="text"
                                placeholder={activeTab === 'VISAO_GERAL' ? "Buscar produto ou categoria..." : "Buscar por funcionário, posto ou produto..."}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={INPUT_STYLE}
                                style={{ paddingLeft: '45px' }}
                            />
                        </div>
                        <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                            <button
                                onClick={() => setSubFilterTipo('Individual')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${subFilterTipo === 'Individual' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                            >
                                Individuais
                            </button>
                            <button
                                onClick={() => setSubFilterTipo('Coletivo')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${subFilterTipo === 'Coletivo' ? 'bg-white shadow text-orange-600' : 'text-slate-500'}`}
                            >
                                Coletivos
                            </button>
                        </div>
                    </div>

                    {/* TABELA: VISÃO GERAL */}
                    {activeTab === 'VISAO_GERAL' && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                            {/* VIEW MOBILE: CARDS (VISÃO GERAL) */}
                            <div className="block md:hidden space-y-3 p-3 bg-slate-50">
                                {produtosFiltrados.map((prod) => (
                                    <div key={prod.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getStripColor(null, prod.categoria) }}></div>
                                        <div className="pl-3 flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-slate-800">{prod.nome}</h4>
                                                <p className="text-xs text-slate-500">{prod.variacao} • {prod.categoria}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-xl font-bold text-slate-800">{prod.estoque_base + prod.estoque_em_uso}</span>
                                                <span className="text-[10px] text-slate-400 uppercase">Total</span>
                                            </div>
                                        </div>
                                        <div className="pl-3 mt-3 grid grid-cols-2 gap-2 text-center">
                                            <div className="bg-blue-50 rounded p-1">
                                                <span className="block text-[10px] text-blue-600 font-bold uppercase">Estoque</span>
                                                <span className="font-bold text-blue-700">{prod.estoque_base}</span>
                                            </div>
                                            <div className="bg-orange-50 rounded p-1">
                                                <span className="block text-[10px] text-orange-600 font-bold uppercase">Em Uso</span>
                                                <span className="font-bold text-orange-700">{prod.estoque_em_uso}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* VIEW DESKTOP: TABLE */}
                            <div className="hidden md:block overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                                        <tr>
                                            <th className="p-4 font-semibold pl-6">Produto / Variação</th>
                                            <th className="p-4 font-semibold">Categoria</th>
                                            <th className="p-4 font-semibold text-center bg-blue-50/50">Em Estoque</th>
                                            <th className="p-4 font-semibold text-center bg-orange-50/50">Em Uso</th>
                                            <th className="p-4 font-semibold text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {produtosFiltrados.map(prod => (
                                            <tr key={prod.id} className="hover:bg-gray-50 transition-colors relative group">
                                                <td className="relative p-0 pl-6 py-4">
                                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getStripColor(null, prod.categoria) }}></div>
                                                    <div className="text-slate-800 font-normal">{prod.nome} <span className="text-slate-500 text-sm ml-1">{prod.variacao}</span></div>
                                                </td>
                                                <td className="p-4 text-sm text-slate-600">{prod.categoria}</td>
                                                <td className="p-4 text-center font-bold text-blue-700 bg-blue-50/30">
                                                    {prod.estoque_base}
                                                </td>
                                                <td className="p-4 text-center font-bold text-orange-700 bg-orange-50/30">
                                                    {prod.estoque_em_uso}
                                                </td>
                                                <td className="p-4 text-right font-medium text-slate-900 pr-6">
                                                    {prod.estoque_base + prod.estoque_em_uso}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TABELA: HISTÓRICO */}
                    {activeTab === 'HISTORICO' && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                            {/* VIEW MOBILE: CARDS (HISTÓRICO) */}
                            <div className="block md:hidden space-y-3 p-3 bg-slate-50">
                                {movimentacoesFiltradas.map((mov) => (
                                    <div key={mov.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getStripColor(mov.empresa_destino) }}></div>
                                        <div className="pl-3 flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-slate-800">{mov.estoque_produtos?.nome}</h4>
                                                <span className="text-xs text-slate-500">{new Date(mov.data_movimento).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-slate-500">{mov.estoque_produtos?.variacao} • {mov.estoque_produtos?.categoria}</p>

                                            <div className="flex justify-between items-center mt-2 bg-gray-50 p-2 rounded-lg">
                                                <div>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border
                                                        ${mov.tipo_movimento === 'ENTREGAR' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                            mov.tipo_movimento === 'DEVOLVER' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                mov.tipo_movimento === 'ADICIONAR_LOTE' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                                    'bg-red-50 text-red-700 border-red-100'
                                                        }`}>
                                                        {mov.tipo_movimento.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="font-bold text-slate-800">Qtd: {mov.quantidade}</div>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-slate-600 mt-1 pl-3">
                                                {mov.funcionarios ? (
                                                    <div className="flex items-center gap-1">
                                                        <User size={14} /> <span className="font-medium">{mov.funcionarios.nome}</span>
                                                    </div>
                                                ) : mov.postos_trabalho ? (
                                                    <div className="flex items-center gap-1">
                                                        <Briefcase size={14} /> <span className="font-medium">{mov.postos_trabalho.nome_posto}</span>
                                                    </div>
                                                ) : <span>-</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* VIEW DESKTOP: TABLE */}
                            <div className="hidden md:block overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                                        <tr>
                                            <th className="p-4 font-semibold pl-6">Produto / Variação</th>
                                            <th className="p-4 font-semibold">Categoria</th>
                                            <th className="p-4 font-semibold">Movimento</th>
                                            <th className="p-4 font-semibold">Destino / Origem</th>
                                            <th className="p-4 font-semibold text-right">Qtd</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {movimentacoesFiltradas.map(mov => (
                                            <tr key={mov.id} className="hover:bg-gray-50 transition-colors relative">
                                                <td className="relative p-0 pl-6 py-4">
                                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getStripColor(mov.empresa_destino) }}></div>
                                                    <div className="text-slate-800 font-normal">{mov.estoque_produtos?.nome} <span className="text-slate-500 text-sm ml-1">{mov.estoque_produtos?.variacao}</span></div>
                                                </td>
                                                <td className="p-4 text-sm text-slate-600">{mov.estoque_produtos?.categoria}</td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase border
                                                        ${mov.tipo_movimento === 'ENTREGAR' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                            mov.tipo_movimento === 'DEVOLVER' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                mov.tipo_movimento === 'ADICIONAR_LOTE' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                                    'bg-red-50 text-red-700 border-red-100'
                                                        }`}>
                                                        {mov.tipo_movimento.replace('_', ' ')}
                                                    </span>
                                                    <div className="text-[10px] text-slate-400 mt-1">{new Date(mov.data_movimento).toLocaleDateString()}</div>
                                                </td>
                                                <td className="p-4 text-sm text-slate-600">
                                                    {mov.funcionarios ? (
                                                        <div className="flex items-center gap-1">
                                                            <User size={14} /> {mov.funcionarios.nome}
                                                        </div>
                                                    ) : mov.postos_trabalho ? (
                                                        <div className="flex items-center gap-1">
                                                            <Briefcase size={14} /> {mov.postos_trabalho.nome_posto}
                                                        </div>
                                                    ) : '-'}
                                                    {mov.empresa_destino && <div className="text-[10px] text-slate-400 mt-0.5 ml-5">{mov.empresa_destino}</div>}
                                                </td>
                                                <td className="p-4 text-right font-bold text-slate-800 pr-6">
                                                    {mov.quantidade}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MODAL DE ADICIONAR PRODUTO --- */}
            {modalMode === 'ADD_PRODUTO' && (
                <div className={MODAL_OVERLAY}>
                    <div className={MODAL_CONTENT}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gray-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Plus size={18} className="text-blue-600" /> Novo Produto
                            </h3>
                            <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveProduto} className="p-6 space-y-4">
                            <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-700 flex gap-2">
                                <Info size={16} />
                                O Código de Referência será gerado automaticamente pelo sistema.
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo</label>
                                <select required className={INPUT_STYLE} value={formProduto.tipo} onChange={e => setFormProduto({ ...formProduto, tipo: e.target.value })}>
                                    <option value="Individual">Material Individual</option>
                                    <option value="Coletivo">Material Coletivo</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome do Produto</label>
                                <input required type="text" placeholder="Ex: Camisa Vigilante" className={INPUT_STYLE} value={formProduto.nome} onChange={e => setFormProduto({ ...formProduto, nome: e.target.value })} />
                            </div>

                            <div className="flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Categoria</label>
                                    <input required type="text" placeholder="Ex: Uniformes" className={INPUT_STYLE} value={formProduto.categoria} onChange={e => setFormProduto({ ...formProduto, categoria: e.target.value })} />
                                </div>
                                <div className="w-1/2">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Variação (Cor/Tam)</label>
                                    <input type="text" placeholder="Ex: G2 Branca" className={INPUT_STYLE} value={formProduto.variacao} onChange={e => setFormProduto({ ...formProduto, variacao: e.target.value })} />
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg shadow-lg shadow-blue-500/20 mt-2">
                                Salvar Produto
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- MODAL DE MOVIMENTAÇÃO (Lógica Atualizada) --- */}
            {modalMode === 'MOVIMENTAR' && (
                <div className={MODAL_OVERLAY}>
                    <div className={MODAL_CONTENT}>
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gray-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <ArrowRight size={18} className="text-blue-600" /> Registrar Movimentação
                            </h3>
                            <button onClick={() => setModalMode(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveMovimento} className="p-6 space-y-4">

                            {/* TIPO DE MOVIMENTO */}
                            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                                {['ENTREGAR', 'DEVOLVER', 'ADICIONAR_LOTE', 'DESCARTAR_LOTE'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            setFormMovimento({ ...formMovimento, tipo_movimento: type, produto_id: '' });
                                            setMoveFilters({ ...moveFilters, entityId: '' }); // Reseta filtro de pessoa ao trocar aba
                                        }}
                                        className={`py-2 text-[10px] font-bold rounded uppercase transition-all ${formMovimento.tipo_movimento === type
                                            ? 'bg-white shadow text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {type.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>

                            {/* --- FLUXO DE DEVOLUÇÃO (Invertido: Seleciona Pessoa -> Vê Produtos) --- */}
                            {formMovimento.tipo_movimento === 'DEVOLVER' ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo Origem</label>
                                            <select className={INPUT_STYLE} value={moveFilters.tipo} onChange={e => setMoveFilters({ ...moveFilters, tipo: e.target.value, entityId: '', categoria: '' })}>
                                                <option value="Individual">Funcionário</option>
                                                <option value="Coletivo">Posto de Trabalho</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Empresa</label>
                                            <select className={INPUT_STYLE} value={formMovimento.empresa_destino} onChange={e => setFormMovimento({ ...formMovimento, empresa_destino: e.target.value })}>
                                                <option value="Femog">Femog</option>
                                                <option value="Semog">Semog</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Seleção de Pessoa/Posto PRIMEIRO */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                                            {moveFilters.tipo === 'Individual' ? 'Funcionário' : 'Posto de Trabalho'}
                                        </label>
                                        <select
                                            className={INPUT_STYLE}
                                            value={moveFilters.entityId}
                                            onChange={(e) => {
                                                setMoveFilters({ ...moveFilters, entityId: e.target.value });
                                                // Ao selecionar pessoa, define IDs no form
                                                if (moveFilters.tipo === 'Individual') {
                                                    setFormMovimento({ ...formMovimento, funcionario_id: e.target.value, posto_trabalho_id: null });
                                                } else {
                                                    setFormMovimento({ ...formMovimento, posto_trabalho_id: e.target.value, funcionario_id: null });
                                                }
                                            }}
                                        >
                                            <option value="">Selecione quem está devolvendo...</option>
                                            {moveFilters.tipo === 'Individual'
                                                ? funcionarios.filter(f => f.empresas?.nome?.includes(formMovimento.empresa_destino)).map(f => <option key={f.id} value={f.id}>{f.nome}</option>)
                                                : postos.map(p => <option key={p.id} value={p.id}>{p.nome_posto}</option>)
                                            }
                                        </select>
                                    </div>

                                    {/* Seleção de Produto (Filtrado pelo que a pessoa tem) */}
                                    {moveFilters.entityId && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Produto a Devolver</label>
                                            <select
                                                required
                                                className={INPUT_STYLE}
                                                value={formMovimento.produto_id}
                                                onChange={e => setFormMovimento({ ...formMovimento, produto_id: e.target.value })}
                                            >
                                                <option value="">Selecione o item...</option>
                                                {getEntityPossession(moveFilters.entityId, moveFilters.tipo === 'Individual').map(item => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.details.nome} ({item.details.variacao}) - Em Posse: {item.qtd}
                                                    </option>
                                                ))}
                                            </select>
                                            {getEntityPossession(moveFilters.entityId, moveFilters.tipo === 'Individual').length === 0 && (
                                                <p className="text-xs text-red-500 mt-1">Nenhum item encontrado com este responsável.</p>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* --- FLUXO PADRÃO (ENTREGAR / ADICIONAR / DESCARTAR) --- */
                                <>
                                    {/* Filtros de Tipo e Categoria */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo</label>
                                            <select
                                                className={INPUT_STYLE}
                                                value={moveFilters.tipo}
                                                onChange={e => setMoveFilters({ ...moveFilters, tipo: e.target.value, categoria: '' })}
                                            >
                                                <option value="Individual">Individual</option>
                                                <option value="Coletivo">Coletivo</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Categoria</label>
                                            <select
                                                className={INPUT_STYLE}
                                                value={moveFilters.categoria}
                                                onChange={e => setMoveFilters({ ...moveFilters, categoria: e.target.value })}
                                            >
                                                <option value="">Todas</option>
                                                {getUniqueCategories(moveFilters.tipo).map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Seleção de Produto */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Produto</label>
                                        <select
                                            required
                                            className={INPUT_STYLE}
                                            value={formMovimento.produto_id}
                                            onChange={e => setFormMovimento({ ...formMovimento, produto_id: e.target.value })}
                                        >
                                            <option value="">Selecione...</option>
                                            {produtos
                                                .filter(p => p.tipo === moveFilters.tipo)
                                                .filter(p => !moveFilters.categoria || p.categoria === moveFilters.categoria)
                                                .map(p => (
                                                    <option key={p.id} value={p.id}>
                                                        {p.nome} - {p.variacao}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    {/* Campos de Destino (Só para ENTREGAR) */}
                                    {formMovimento.tipo_movimento === 'ENTREGAR' && renderCamposDestino()}
                                </>
                            )}

                            {/* Exibição de Saldo Atual (Feedback Visual) */}
                            {formMovimento.produto_id && formMovimento.tipo_movimento !== 'DEVOLVER' && (
                                <div className="flex gap-4 text-xs font-medium">
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
                                        Em Estoque (Base): {getStockInfo(formMovimento.produto_id)?.base}
                                    </span>
                                </div>
                            )}

                            {/* Quantidade e Data */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Quantidade</label>
                                    <input required type="number" min="1" className={INPUT_STYLE} value={formMovimento.quantidade} onChange={e => setFormMovimento({ ...formMovimento, quantidade: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data</label>
                                    <input required type="date" className={INPUT_STYLE} value={formMovimento.data_movimento} onChange={e => setFormMovimento({ ...formMovimento, data_movimento: e.target.value })} />
                                </div>
                            </div>

                            <div className="pt-2">
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Observação (Opcional)</label>
                                <input type="text" className={INPUT_STYLE} value={formMovimento.observacao} onChange={e => setFormMovimento({ ...formMovimento, observacao: e.target.value })} />
                            </div>

                            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg shadow-lg shadow-emerald-500/20 mt-4 flex justify-center items-center gap-2">
                                <Save size={18} /> Confirmar Movimentação
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- FEEDBACK MODAL --- */}
            {feedbackModal.open && (
                <div className={MODAL_OVERLAY}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-200">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${feedbackModal.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {feedbackModal.type === 'success' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{feedbackModal.title}</h3>
                        <p className="text-slate-600 mb-6">{feedbackModal.message}</p>
                        <button
                            onClick={() => setFeedbackModal({ ...feedbackModal, open: false })}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${feedbackModal.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25' : 'bg-red-600 hover:bg-red-700 shadow-red-500/25'}`}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ControleEstoque;
