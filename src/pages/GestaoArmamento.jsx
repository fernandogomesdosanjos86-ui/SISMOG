import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Search, Trash2, Shield, Target, Box, Save, X, ArrowRight, CornerDownLeft, Info, Edit, AlertCircle, CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const INITIAL_FORM = { tipo: 'Arma', descricao: '', numero_serie: '', quantidade: 1, origem_id: '', destino_id: '', item_id: '' };

const EquipamentosControlados = () => {
    const [items, setItems] = useState([]);
    const [postos, setPostos] = useState([]);
    const [femogId, setFemogId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('inventario');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLocalizacao, setFilterLocalizacao] = useState('');
    const [filterTipo, setFilterTipo] = useState('');

    const [modalType, setModalType] = useState(null);
    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [formData, setFormData] = useState(INITIAL_FORM);
    const [isSaving, setIsSaving] = useState(false);
    const [feedbackModal, setFeedbackModal] = useState({ open: false, type: 'success', title: '', message: '' });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Busca específica pela FEMOG para travar o contexto
            const { data: emp } = await supabase.from('empresas').select('id').ilike('nome', '%femog%').single();
            if (emp) setFemogId(emp.id);

            const [resItems, resPostos] = await Promise.all([
                supabase.from('equipamentos_controle').select('*, postos_trabalho(nome_posto), empresas(nome)').order('descricao'),
                supabase.from('postos_trabalho').select('id, nome_posto').eq('ativo', true).order('nome_posto')
            ]);

            setItems(resItems.data || []);
            setPostos(resPostos.data || []);
        } catch (e) { console.error('Erro ao carregar dados:', e); } finally { setLoading(false); }
    };

    const closeAndRefresh = () => {
        setModalType(null); // Fecha o modal primeiro
        setFormData(INITIAL_FORM); // Zera TUDO (limpa o cache do equipamento anterior)
        fetchData(); // Atualiza a lista
    };

    // --- LÓGICA DE MOVIMENTAÇÃO ---
    const handleAction = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (modalType === 'ADD' || modalType === 'EDIT') {
                const payload = {
                    empresa_id: femogId,
                    tipo: formData.tipo,
                    descricao: formData.descricao,
                    quantidade: formData.tipo === 'Munição' ? parseInt(formData.quantidade) : 1,
                    numero_serie: formData.tipo === 'Munição' ? null : (formData.numero_serie ? formData.numero_serie.toUpperCase() : null),
                    posto_trabalho_id: null
                };

                if (modalType === 'EDIT') {
                    await supabase.from('equipamentos_controle')
                        .update({
                            descricao: payload.descricao,
                            numero_serie: payload.numero_serie,
                            quantidade: payload.quantidade
                        })
                        .eq('id', formData.item_id);
                } else {
                    if (formData.tipo === 'Munição') {
                        const existing = items.find(i => i.tipo === 'Munição' && i.descricao === payload.descricao && !i.posto_trabalho_id);
                        if (existing) await supabase.from('equipamentos_controle').update({ quantidade: existing.quantidade + payload.quantidade }).eq('id', existing.id);
                        else await supabase.from('equipamentos_controle').insert([payload]);
                    } else {
                        await supabase.from('equipamentos_controle').insert([payload]);
                    }
                }

            } else {
                const destino = formData.destino_id || null;
                if (formData.tipo === 'Munição') {
                    const itemOrigem = items.find(i => i.tipo === 'Munição' && i.descricao === formData.descricao && (i.posto_trabalho_id == (formData.origem_id || null)));
                    const qtd = parseInt(formData.quantidade);
                    if (!itemOrigem || itemOrigem.quantidade < qtd) throw new Error("Saldo insuficiente.");
                    if (itemOrigem.quantidade === qtd) await supabase.from('equipamentos_controle').delete().eq('id', itemOrigem.id);
                    else await supabase.from('equipamentos_controle').update({ quantidade: itemOrigem.quantidade - qtd }).eq('id', itemOrigem.id);
                    const { data: extDest } = await supabase.from('equipamentos_controle').select('*').eq('tipo', 'Munição').eq('descricao', formData.descricao).filter('posto_trabalho_id', destino === null ? 'is' : 'eq', destino).single();
                    if (extDest) await supabase.from('equipamentos_controle').update({ quantidade: extDest.quantidade + qtd }).eq('id', extDest.id);
                    else await supabase.from('equipamentos_controle').insert([{ empresa_id: femogId, posto_trabalho_id: destino, tipo: 'Munição', descricao: formData.descricao, quantidade: qtd }]);
                } else {
                    await supabase.from('equipamentos_controle').update({ posto_trabalho_id: destino }).eq('id', formData.item_id);
                }
            }

            setModalType(null);
            setFormData(INITIAL_FORM);
            fetchData();
            setFeedbackModal({
                open: true,
                type: 'success',
                title: 'Sucesso!',
                message: 'Equipamento registrado e estoque atualizado.'
            });
        } catch (e) {
            setFeedbackModal({ open: true, type: 'error', title: 'Erro na Operação', message: e.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (item) => {
        setFormData({
            tipo: item.tipo,
            descricao: item.descricao,
            numero_serie: item.numero_serie || '',
            quantidade: item.quantidade,
            origem_id: '',
            destino_id: '',
            item_id: item.id
        });
        setModalType('EDIT');
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await supabase.from('equipamentos_controle').delete().eq('id', itemToDelete.id);
            fetchData();
            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (e) {
            console.error(e);
            alert('Erro ao excluir: ' + e.message);
        }
    };

    const stats = useMemo(() => {
        const calc = (type) => items.filter(i => i.tipo === type).reduce((acc, curr) => {
            acc.total += curr.quantidade;
            if (curr.posto_trabalho_id) acc.posto += curr.quantidade; else acc.base += curr.quantidade;
            return acc;
        }, { total: 0, base: 0, posto: 0 });
        return { armas: calc('Arma'), coletes: calc('Colete Balístico'), municao: calc('Munição') };
    }, [items]);

    const filtered = items.filter(i => {
        const matchesTab = activeTab === 'inventario' ? true : i.posto_trabalho_id !== null;
        const matchesSearch = (i.descricao + (i.numero_serie || '')).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLoc = filterLocalizacao ? (filterLocalizacao === 'base' ? i.posto_trabalho_id === null : i.posto_trabalho_id == filterLocalizacao) : true;
        const matchesType = filterTipo ? i.tipo === filterTipo : true;

        return matchesTab && matchesSearch && matchesLoc && matchesType;
    });

    const getEmpresaStripColor = (nome) => (nome?.toLowerCase().includes('semog') ? '#f97316' : '#2563eb');

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="ml-0 md:ml-72 transition-all duration-300 flex-1 p-4 md:p-8 lg:p-12 text-slate-900">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Shield className="text-blue-600" /> Equipamentos Controlados
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Controle de Inventário e Movimentação Bélica - FEMOG
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    setFormData(INITIAL_FORM); // Garante que está vazio
                                    setModalType('ADD'); // Força abertura do modal de adição
                                }}
                                className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-500/20 font-medium text-sm"
                            >
                                <Plus size={18} />
                                <span>Adicionar ao Estoque</span>
                            </button>
                            <button
                                onClick={() => { setModalType('DESTINAR'); setFormData({ ...formData, origem_id: '' }); }}
                                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/20 font-medium text-sm"
                            >
                                <ArrowRight size={18} />
                                <span>Destinar ao Posto</span>
                            </button>
                            <button
                                onClick={() => setModalType('DEVOLVER')}
                                className="flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-slate-500/20 font-medium text-sm"
                            >
                                <CornerDownLeft size={18} />
                                <span>Devolver / Transferir</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { label: 'Armas', val: stats.armas, ic: <Target className="text-blue-600" size={24} />, bg: 'bg-blue-50' },
                            { label: 'Coletes', val: stats.coletes, ic: <Shield className="text-emerald-600" size={24} />, bg: 'bg-emerald-50' },
                            { label: 'Munição', val: stats.municao, ic: <Box className="text-orange-600" size={24} />, bg: 'bg-orange-50' }
                        ].map((s, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{s.label}</p>
                                        <h3 className="text-2xl font-bold text-slate-800 mt-1">{s.val.total}</h3>
                                    </div>
                                    <div className={`p-3 rounded-lg ${s.bg}`}>
                                        {s.ic}
                                    </div>
                                </div>
                                <div className="pt-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500 font-medium">
                                    <span className="flex items-center gap-1.5" title="Em Estoque (Base)">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Base: <span className="text-slate-700 font-bold">{s.val.base}</span>
                                    </span>
                                    <span className="flex items-center gap-1.5" title="Em Postos">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Posto: <span className="text-slate-700 font-bold">{s.val.posto}</span>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* --- BLOCO DE PESQUISA E FILTROS PADRÃO SISMOG --- */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                        {/* Busca com Lupa (45px padding-left) */}
                        <div className="relative w-full md:w-[40%]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por série ou modelo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-base"
                                style={{ height: '48px', paddingLeft: '45px', paddingRight: '16px' }}
                            />
                        </div>

                        {/* Filtros Dropdown (Modelo Faturamentos) */}
                        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                            <select
                                value={filterLocalizacao}
                                onChange={(e) => setFilterLocalizacao(e.target.value)}
                                className="px-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                style={{ height: '48px', minWidth: '180px' }}
                            >
                                <option value="">Todas Localizações</option>
                                <option value="base">Base / Estoque</option>
                                {postos.map(p => <option key={p.id} value={p.id}>{p.nome_posto}</option>)}
                            </select>

                            <select
                                value={filterTipo}
                                onChange={(e) => setFilterTipo(e.target.value)}
                                className="px-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                style={{ height: '48px', minWidth: '160px' }}
                            >
                                <option value="">Todos os Tipos</option>
                                <option value="Arma">Armas</option>
                                <option value="Colete Balístico">Coletes</option>
                                <option value="Munição">Munições</option>
                            </select>
                        </div>
                    </div>

                    {/* --- NOVA DIVISÃO DE GUIAS (ABAS) --- */}
                    <div className="flex bg-slate-200/50 p-1.5 rounded-xl w-fit border border-slate-200/60 shadow-inner">
                        <button
                            onClick={() => setActiveTab('inventario')}
                            className={`px-6 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'inventario'
                                ? 'bg-white shadow-md text-blue-600 border border-slate-100'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                            style={{ height: '40px' }}
                        >
                            <Box size={14} /> INVENTÁRIO GERAL
                        </button>
                        <button
                            onClick={() => setActiveTab('em_uso')}
                            className={`px-6 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'em_uso'
                                ? 'bg-white shadow-md text-blue-600 border border-slate-100'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                            style={{ height: '40px' }}
                        >
                            <Target size={14} /> EQUIPAMENTOS EM USO
                        </button>
                    </div>

                    {/* --- LISTAGEM: CARDS (MOBILE) vs TABELA (DESKTOP) --- */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                        {/* VIEW MOBILE: CARDS */}
                        <div className="block md:hidden divide-y divide-slate-100">
                            {filtered.map(item => (
                                <div key={item.id} className="relative p-4 flex flex-col gap-3 bg-white">
                                    {/* Faixa Vertical SISMOG Mobile */}
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: item.posto_trabalho_id ? '#2563eb' : '#9ca3af' }}></div>

                                    <div className="pl-3 flex justify-between items-start">
                                        <div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border mb-1 ${item.tipo === 'Arma' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    item.tipo === 'Munição' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                {item.tipo}
                                            </span>
                                            <div className="font-medium text-slate-800 text-sm">{item.descricao}</div>
                                            <div className="font-mono text-xs text-slate-500 mt-0.5">
                                                SN: {item.numero_serie || 'LOTE'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-lg font-bold text-slate-800">{item.quantidade}</span>
                                            <span className="text-[10px] text-slate-400 uppercase">QTD</span>
                                        </div>
                                    </div>

                                    <div className="pl-3 flex items-center justify-between mt-1 pt-3 border-t border-slate-50">
                                        <div className="text-xs">
                                            {item.postos_trabalho ? (
                                                <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                    {item.postos_trabalho.nome_posto}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                                    ESTOQUE BASE
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* VIEW DESKTOP: TABELA PADRÃO */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-semibold pl-6">Equipamento</th>
                                        <th className="p-4 font-semibold">Tipo</th>
                                        <th className="p-4 font-semibold">Série / Lote</th>
                                        <th className="p-4 font-semibold text-center">Qtd</th>
                                        <th className="p-4 font-semibold">Localização</th>
                                        <th className="p-4 font-semibold text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors relative group">
                                            <td className="relative p-0 pl-6 py-4">
                                                {/* Faixa Vertical SISMOG */}
                                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: item.posto_trabalho_id ? '#2563eb' : '#9ca3af' }}></div>
                                                <div className="font-normal text-slate-700">{item.descricao}</div>
                                            </td>

                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${item.tipo === 'Arma' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    item.tipo === 'Munição' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    }`}>
                                                    {item.tipo}
                                                </span>
                                            </td>

                                            <td className="p-4">
                                                <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                    {item.numero_serie || 'LOTE MUNIÇÃO'}
                                                </span>
                                            </td>

                                            <td className="p-4 text-center font-bold text-slate-800">{item.quantidade}</td>

                                            <td className="p-4">
                                                {item.postos_trabalho ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                                        {item.postos_trabalho.nome_posto}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                                                        Estoque (Base)
                                                    </span>
                                                )}
                                            </td>

                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {modalType && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all scale-100 m-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gray-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Info size={16} className="text-blue-600" />
                                {modalType === 'ADD' ? 'Novo Lançamento' : (modalType === 'EDIT' ? 'Editar Equipamento' : 'Movimentação')}
                            </h3>
                            <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAction} className="p-6 space-y-6">
                            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-4">
                                {['Arma', 'Colete Balístico', 'Munição'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, tipo: t, item_id: '', descricao: '', numero_serie: '', quantidade: 1 })}
                                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${formData.tipo === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {t.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            {modalType !== 'ADD' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Origem</label>
                                        <select
                                            disabled={modalType === 'DESTINAR'}
                                            className="w-full px-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            style={{ height: '48px' }}
                                            value={formData.origem_id}
                                            onChange={e => setFormData({ ...formData, origem_id: e.target.value })}
                                        >
                                            <option value="">BASE / ESTOQUE</option>
                                            {postos.map(p => <option key={p.id} value={p.id}>{p.nome_posto}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Destino</label>
                                        <select
                                            className="w-full px-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                            style={{ height: '48px' }}
                                            value={formData.destino_id}
                                            onChange={e => setFormData({ ...formData, destino_id: e.target.value })}
                                        >
                                            <option value="">BASE / ESTOQUE</option>
                                            {postos.map(p => <option key={p.id} value={p.id}>{p.nome_posto}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {(modalType === 'ADD' || modalType === 'EDIT') ? (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descrição / Modelo</label>
                                    <input
                                        required
                                        className="w-full px-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        style={{ height: '48px' }}
                                        value={formData.descricao}
                                        onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                        placeholder="Ex: Taurus 82S / Colete II-A"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Selecione o Item</label>
                                    <select
                                        required
                                        className="w-full px-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        style={{ height: '48px' }}
                                        onChange={e => { const i = items.find(x => x.id === e.target.value); if (i) setFormData({ ...formData, item_id: i.id, descricao: i.descricao }); }}
                                    >
                                        <option value="">Selecione na Origem...</option>
                                        {items.filter(i => i.tipo === formData.tipo && (i.posto_trabalho_id == (formData.origem_id || null))).map(i => <option key={i.id} value={i.id}>{i.descricao} {i.numero_serie ? `(SN: ${i.numero_serie})` : `(Qtd: ${i.quantidade})`}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formData.tipo !== 'Munição' && (modalType === 'ADD' || modalType === 'EDIT') && (
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Série</label>
                                        <input
                                            required
                                            className="w-full px-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 uppercase font-mono"
                                            style={{ height: '48px' }}
                                            value={formData.numero_serie}
                                            onChange={e => setFormData({ ...formData, numero_serie: e.target.value })}
                                        />
                                    </div>
                                )}
                                {(formData.tipo === 'Munição' || (formData.tipo !== 'Munição' && (modalType === 'ADD' || modalType === 'EDIT'))) && (
                                    <div className={`col-span-2 ${formData.tipo !== 'Munição' ? 'md:col-span-1' : ''}`}>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Quantidade</label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            disabled={formData.tipo !== 'Munição'}
                                            className={`w-full px-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${formData.tipo !== 'Munição' ? 'bg-gray-100 text-slate-500 cursor-not-allowed' : ''}`}
                                            style={{ height: '48px' }}
                                            value={formData.quantidade}
                                            onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setModalType(null)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow hover:shadow-lg transition-all flex items-center space-x-2"
                                >
                                    <Save size={16} />
                                    <span>Confirmar Operação</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {
                deleteModalOpen && itemToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="text-red-600" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Confirmar Exclusão</h3>
                                <p className="text-slate-600 text-sm mb-6">
                                    Tem certeza que deseja excluir <strong>{itemToDelete.descricao}</strong>? Esta ação não pode ser desfeita.
                                </p>
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <button
                                        onClick={() => setDeleteModalOpen(false)}
                                        className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-lg shadow-red-500/30 transition-all text-sm block"
                                    >
                                        Sim, Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {feedbackModal.open && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${feedbackModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {feedbackModal.type === 'success' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{feedbackModal.title}</h3>
                        <p className="text-slate-600 mb-6">{feedbackModal.message}</p>
                        <button
                            onClick={() => setFeedbackModal({ ...feedbackModal, open: false })}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${feedbackModal.type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/25' : 'bg-red-600 hover:bg-red-700 shadow-red-500/25'}`}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}

        </div >
    );
};

export default EquipamentosControlados;
