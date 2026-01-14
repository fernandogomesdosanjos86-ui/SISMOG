import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Search, Edit, Trash2, CreditCard, CheckCircle, AlertCircle, X, Save, Building2, Eye } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

const CartoesCredito = () => {
    const [cartoes, setCartoes] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const INITIAL_STATE = {
        empresa_id: '',
        banco: '',
        bandeira: '',
        numero_cartao: '',
        usuario: '',
        limite: '',
        ativo: true
    };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCartao, setCurrentCartao] = useState(INITIAL_STATE);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [modalMode, setModalMode] = useState('EDIT'); // 'EDIT' or 'VIEW'

    // Feedback & Delete State
    const [feedbackModal, setFeedbackModal] = useState({ open: false, type: 'success', title: '', message: '' });
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [cartaoToDelete, setCartaoToDelete] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resCartoes, resEmpresas] = await Promise.all([
                supabase.from('financeiro_cartoes_credito').select('*, empresas(nome)').order('created_at', { ascending: false }),
                supabase.from('empresas').select('id, nome').order('nome')
            ]);

            if (resCartoes.error) throw resCartoes.error;
            if (resEmpresas.error) throw resEmpresas.error;

            setCartoes(resCartoes.data || []);
            setEmpresas(resEmpresas.data || []);
        } catch (error) {
            console.error('Erro ao buscar dados:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const getEmpresaStripColor = (nomeEmpresa) => {
        const nome = (nomeEmpresa || '').toLowerCase();
        if (nome.includes('femog')) return '#2563eb';
        if (nome.includes('semog')) return '#f97316';
        return '#9ca3af';
    };

    const handleOpenModal = (cartao = null) => {
        if (cartao) {
            setCurrentCartao({
                ...cartao,
                empresa_id: cartao.empresa_id || cartao.empresa
            });
            setIsEditing(true);
        } else {
            setCurrentCartao(INITIAL_STATE);
            setIsEditing(false);
        }
        setModalMode('EDIT');
        setIsModalOpen(true);
    };

    const handleOpenViewModal = (cartao) => {
        setCurrentCartao({
            ...cartao,
            empresa_id: cartao.empresa_id || cartao.empresa
        });
        setModalMode('VIEW');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCartao(INITIAL_STATE);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                empresa_id: currentCartao.empresa_id,
                banco: currentCartao.banco,
                bandeira: currentCartao.bandeira,
                numero_cartao: currentCartao.numero_cartao,
                usuario: currentCartao.usuario,
                limite: currentCartao.limite,
                ativo: currentCartao.ativo
            };

            if (isEditing) {
                const { error } = await supabase
                    .from('financeiro_cartoes_credito')
                    .update(payload)
                    .eq('id', currentCartao.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('financeiro_cartoes_credito')
                    .insert([payload]);
                if (error) throw error;
            }
            fetchData();
            handleCloseModal();
            setFeedbackModal({ open: true, type: 'success', title: 'Sucesso!', message: 'Cartão salvo com sucesso!' });
        } catch (error) {
            console.error('Erro ao salvar cartão:', error.message);
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (cartao) => {
        setCartaoToDelete(cartao);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!cartaoToDelete) return;
        try {
            const { error } = await supabase
                .from('financeiro_cartoes_credito')
                .delete()
                .eq('id', cartaoToDelete.id);

            if (error) throw error;
            fetchData();
            setDeleteModalOpen(false);
            setCartaoToDelete(null);
            setFeedbackModal({ open: true, type: 'success', title: 'Sucesso!', message: 'Cartão removido com sucesso!' });
        } catch (error) {
            console.error('Erro ao excluir cartão:', error.message);
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const filteredCartoes = cartoes.filter(c =>
        c.empresas?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.usuario?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="ml-0 md:ml-72 transition-all duration-300 flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden text-slate-900 relative">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <CreditCard className="text-blue-600" /> Cartões de Crédito
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Gerenciamento de cartões corporativos
                            </p>
                        </div>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/20 font-medium text-sm"
                        >
                            <Plus size={20} />
                            <span>Novo Cartão</span>
                        </button>
                    </div>

                    {/* Filter */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center shadow-sm">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por empresa ou usuário..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-base pl-[45px]"
                                style={{ height: '48px' }}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                        {/* VIEW MOBILE: CARDS */}
                        <div className="block md:hidden divide-y divide-slate-100">
                            {filteredCartoes.map((cartao) => (
                                <div key={cartao.id} className="relative p-4 flex flex-col gap-3 bg-white">
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#64748b' }}></div> {/* Faixa Slate */}
                                    <div className="pl-3 flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                            <CreditCard size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{cartao.banco} - {cartao.bandeira}</h4>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                                                {cartao.numero_cartao}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pl-3 flex justify-between items-center text-sm text-slate-600">
                                        <span>Limit: <strong>{formatCurrency(cartao.limite)}</strong></span>
                                        <span className="text-xs">{cartao.usuario}</span>
                                    </div>

                                    <div className="pl-3 mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                                        <span className="text-[10px] font-bold uppercase text-slate-400">
                                            {cartao.empresas?.nome || 'PJ'}
                                        </span>
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); handleOpenModal(cartao); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(cartao); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* VIEW DESKTOP: TABLE */}
                        <div className="hidden md:block overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                                        <th className="p-4 font-semibold pl-6">Cartão</th>
                                        <th className="p-4 font-semibold">Número do Cartão</th>
                                        <th className="p-4 font-semibold">Limite</th>
                                        <th className="p-4 font-semibold">Empresa</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-slate-500">Carregando...</td>
                                        </tr>
                                    ) : filteredCartoes.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="p-8 text-center text-slate-500">Nenhum cartão encontrado.</td>
                                        </tr>
                                    ) : (
                                        filteredCartoes.map((cartao) => (
                                            <tr
                                                key={cartao.id}
                                                onClick={() => handleOpenViewModal(cartao)}
                                                className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                            >
                                                <td className="relative p-4 pl-6">
                                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getEmpresaStripColor(cartao.empresas?.nome) }}></div>
                                                    <div className="text-slate-700 font-normal">{cartao.banco} - {cartao.bandeira}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-slate-700 font-normal">{cartao.numero_cartao}</div>
                                                </td>
                                                <td className="p-4 font-medium text-slate-700">
                                                    {formatCurrency(cartao.limite)}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${(cartao.empresas?.nome || '').toLowerCase().includes('semog')
                                                        ? 'bg-orange-50 text-orange-700 border-orange-100'
                                                        : (cartao.empresas?.nome || '').toLowerCase().includes('femog')
                                                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                            : 'bg-gray-50 text-slate-700 border-gray-100'
                                                        }`}>
                                                        {cartao.empresas?.nome}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cartao.ativo ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-slate-500 border-gray-200'}`}>
                                                        {cartao.ativo ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenModal(cartao); }}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(cartao); }}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Edit/Create/View */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gray-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <CreditCard size={20} className="text-blue-600" />
                                {modalMode === 'VIEW' ? 'Detalhes do Cartão' : (isEditing ? 'Editar Cartão' : 'Novo Cartão')}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Empresa</label>
                                    <select
                                        required
                                        disabled={modalMode === 'VIEW'}
                                        value={currentCartao.empresa_id}
                                        onChange={(e) => setCurrentCartao({ ...currentCartao, empresa_id: e.target.value })}
                                        className={`w-full px-4 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${modalMode === 'VIEW' ? 'bg-gray-50' : 'bg-white'}`}
                                        style={{ height: '48px' }}
                                    >
                                        <option value="">Selecione a empresa...</option>
                                        {empresas.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Banco</label>
                                        <input
                                            type="text"
                                            required
                                            readOnly={modalMode === 'VIEW'}
                                            value={currentCartao.banco}
                                            onChange={(e) => setCurrentCartao({ ...currentCartao, banco: e.target.value })}
                                            className={`w-full px-4 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${modalMode === 'VIEW' ? 'bg-gray-50 text-slate-600' : 'bg-white'}`}
                                            style={{ height: '48px' }}
                                            placeholder="Ex: Itaú"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Bandeira</label>
                                        <input
                                            type="text"
                                            required
                                            readOnly={modalMode === 'VIEW'}
                                            value={currentCartao.bandeira}
                                            onChange={(e) => setCurrentCartao({ ...currentCartao, bandeira: e.target.value })}
                                            className={`w-full px-4 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${modalMode === 'VIEW' ? 'bg-gray-50 text-slate-600' : 'bg-white'}`}
                                            style={{ height: '48px' }}
                                            placeholder="Ex: Visa"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nº Cartão</label>
                                        <input
                                            type="text"
                                            required
                                            readOnly={modalMode === 'VIEW'}
                                            value={currentCartao.numero_cartao}
                                            onChange={(e) => setCurrentCartao({ ...currentCartao, numero_cartao: e.target.value })}
                                            className={`w-full px-4 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${modalMode === 'VIEW' ? 'bg-gray-50 text-slate-600' : 'bg-white'}`}
                                            style={{ height: '48px' }}
                                            placeholder="**** 1234"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Limite (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            readOnly={modalMode === 'VIEW'}
                                            value={currentCartao.limite}
                                            onChange={(e) => setCurrentCartao({ ...currentCartao, limite: e.target.value })}
                                            className={`w-full px-4 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${modalMode === 'VIEW' ? 'bg-gray-50 text-slate-600' : 'bg-white'}`}
                                            style={{ height: '48px' }}
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Usuário / Portador</label>
                                    <input
                                        type="text"
                                        required
                                        readOnly={modalMode === 'VIEW'}
                                        value={currentCartao.usuario}
                                        onChange={(e) => setCurrentCartao({ ...currentCartao, usuario: e.target.value })}
                                        className={`w-full px-4 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${modalMode === 'VIEW' ? 'bg-gray-50 text-slate-600' : 'bg-white'}`}
                                        style={{ height: '48px' }}
                                        placeholder="Quem utiliza o cartão"
                                    />
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <label className="relative inline-flex items-center cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            disabled={modalMode === 'VIEW'}
                                            checked={currentCartao.ativo}
                                            onChange={(e) => setCurrentCartao({ ...currentCartao, ativo: e.target.checked })}
                                        />
                                        <div className={`w-11 h-6 bg-gray-200 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${modalMode === 'VIEW' ? 'opacity-60' : 'peer-checked:bg-blue-600 peer-checked:after:translate-x-full'}`}></div>
                                    </label>
                                    <span className="text-sm font-medium text-slate-700">Cartão Ativo?</span>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
                                    {modalMode === 'VIEW' ? 'Fechar' : 'Cancelar'}
                                </button>
                                {modalMode !== 'VIEW' && (
                                    <button type="submit" disabled={isSaving} className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2">
                                        <Save size={18} />
                                        <span>{isSaving ? 'Salvando...' : 'Salvar Dados'}</span>
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModalOpen && cartaoToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="text-red-600" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Confirmar Exclusão</h3>
                            <p className="text-slate-600 text-sm mb-6">Tem certeza que deseja excluir este cartão?</p>
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button onClick={() => setDeleteModalOpen(false)} className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-medium transition-colors text-sm">Cancelar</button>
                                <button onClick={confirmDelete} className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-lg shadow-red-500/30 transition-all text-sm block">Sim, Excluir</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {feedbackModal.open && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${feedbackModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {feedbackModal.type === 'success' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{feedbackModal.title}</h3>
                        <p className="text-slate-600 mb-6">{feedbackModal.message}</p>
                        <button onClick={() => setFeedbackModal({ ...feedbackModal, open: false })} className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${feedbackModal.type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/25' : 'bg-red-600 hover:bg-red-700 shadow-red-500/25'}`}>Entendido</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartoesCredito;
