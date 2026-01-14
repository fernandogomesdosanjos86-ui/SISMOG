import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Search, Edit, Trash2, Banknote, CheckCircle, AlertCircle, X, Save, Building2, CreditCard, Hash, Eye } from 'lucide-react';
import Sidebar from '../../components/Sidebar';

const ContasCorrente = () => {
    const [contas, setContas] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const INITIAL_STATE = { empresa_id: '', banco: '', numero_banco: '', agencia: '', conta: '', ativa: true };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentConta, setCurrentConta] = useState(INITIAL_STATE);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [modalMode, setModalMode] = useState('EDIT'); // 'EDIT' or 'VIEW'

    const [feedbackModal, setFeedbackModal] = useState({ open: false, type: 'success', title: '', message: '' });
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [contaToDelete, setContaToDelete] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resContas, resEmpresas] = await Promise.all([
                supabase.from('financeiro_contas_corrente').select('*, empresas(nome)').order('created_at', { ascending: false }),
                supabase.from('empresas').select('id, nome').order('nome')
            ]);

            if (resContas.error) throw resContas.error;
            if (resEmpresas.error) throw resEmpresas.error;

            setContas(resContas.data || []);
            setEmpresas(resEmpresas.data || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error.message);
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

    const handleOpenModal = (conta = null) => {
        if (conta) {
            setCurrentConta(conta);
            setIsEditing(true);
        } else {
            setCurrentConta(INITIAL_STATE);
            setIsEditing(false);
        }
        setModalMode('EDIT');
        setIsModalOpen(true);
    };

    const handleOpenViewModal = (conta) => {
        setCurrentConta(conta);
        setModalMode('VIEW');
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                empresa_id: currentConta.empresa_id,
                banco: currentConta.banco,
                numero_banco: currentConta.numero_banco,
                agencia: currentConta.agencia,
                conta: currentConta.conta,
                ativa: currentConta.ativa
            };

            const { error } = isEditing
                ? await supabase.from('financeiro_contas_corrente').update(payload).eq('id', currentConta.id)
                : await supabase.from('financeiro_contas_corrente').insert([payload]);

            if (error) throw error;

            fetchData();
            setIsModalOpen(false);
            setFeedbackModal({ open: true, type: 'success', title: 'Sucesso!', message: 'Dados bancários salvos com sucesso!' });
        } catch (error) {
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        try {
            const { error } = await supabase.from('financeiro_contas_corrente').delete().eq('id', contaToDelete.id);
            if (error) throw error;
            fetchData();
            setDeleteModalOpen(false);
            setFeedbackModal({ open: true, type: 'success', title: 'Removido!', message: 'Conta excluída com sucesso.' });
        } catch (error) {
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        }
    };

    const filteredContas = contas.filter(c =>
        c.empresas?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.banco?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="ml-0 md:ml-72 transition-all duration-300 flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden text-slate-900 relative">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Banknote className="text-blue-600" /> Contas Corrente
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">Gestão de domicílio bancário das empresas</p>
                        </div>
                        <button onClick={() => handleOpenModal()} className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/20 font-medium text-sm">
                            <Plus size={20} /> <span>Nova Conta</span>
                        </button>
                    </div>

                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input type="text" placeholder="Buscar empresa ou banco..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg pl-[45px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-900" style={{ height: '48px' }} />
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                        {/* VIEW MOBILE: CARDS */}
                        <div className="block md:hidden divide-y divide-slate-100">
                            {filteredContas.map((conta) => (
                                <div key={conta.id} className="relative p-4 flex flex-col gap-3 bg-white">
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#64748b' }}></div> {/* Faixa Slate */}
                                    <div className="pl-3 flex items-center gap-3">
                                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{conta.banco}</h4>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                                                Ag: {conta.agencia} / CC: {conta.conta}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pl-3 mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                                        <span className="text-[10px] font-bold uppercase text-slate-400">
                                            {conta.empresas?.nome || 'PJ'}
                                        </span>
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); handleOpenModal(conta); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); setContaToDelete(conta); setDeleteModalOpen(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
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
                                        <th className="p-4 pl-6 font-semibold">Banco</th>
                                        <th className="p-4 font-semibold">Agência / Conta</th>
                                        <th className="p-4 font-semibold">Empresa</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (<tr><td colSpan="5" className="p-8 text-center text-slate-500">Carregando...</td></tr>) :
                                        filteredContas.map((conta) => (
                                            <tr
                                                key={conta.id}
                                                onClick={() => handleOpenViewModal(conta)}
                                                className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                            >
                                                <td className="relative p-4 pl-6">
                                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getEmpresaStripColor(conta.empresas?.nome) }}></div>
                                                    <div className="text-slate-700 font-normal">{conta.banco}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-slate-700 font-normal">Ag: {conta.agencia} | CC: {conta.conta}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${(conta.empresas?.nome || '').toLowerCase().includes('semog')
                                                        ? 'bg-orange-50 text-orange-700 border-orange-100'
                                                        : (conta.empresas?.nome || '').toLowerCase().includes('femog')
                                                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                            : 'bg-gray-50 text-slate-700 border-gray-100'
                                                        }`}>
                                                        {conta.empresas?.nome}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${conta.ativa ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-slate-500 border-gray-200'}`}>
                                                        {conta.ativa ? 'Ativa' : 'Inativa'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(conta); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); setContaToDelete(conta); setDeleteModalOpen(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
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

            {/* Modal de Cadastro/Edição/Visualização */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gray-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Banknote size={20} className="text-blue-600" />
                                {modalMode === 'VIEW' ? 'Detalhes da Conta' : (isEditing ? 'Editar Conta' : 'Nova Conta')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Empresa</label>
                                <select
                                    required
                                    disabled={modalMode === 'VIEW'}
                                    value={currentConta.empresa_id}
                                    onChange={(e) => setCurrentConta({ ...currentConta, empresa_id: e.target.value })}
                                    className={`w-full px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-slate-700 ${modalMode === 'VIEW' ? 'bg-gray-50' : 'bg-white'}`}
                                    style={{ height: '48px' }}
                                >
                                    <option value="">Selecione uma empresa</option>
                                    {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Banco</label>
                                    <div className="relative">
                                        <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 ${modalMode === 'VIEW' ? 'text-slate-300' : 'text-slate-400'}`} size={16} />
                                        <input
                                            type="text"
                                            required
                                            readOnly={modalMode === 'VIEW'}
                                            value={currentConta.banco}
                                            onChange={(e) => setCurrentConta({ ...currentConta, banco: e.target.value })}
                                            className={`w-full pl-10 pr-4 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none ${modalMode === 'VIEW' ? 'bg-gray-50 text-slate-600' : 'bg-white'}`}
                                            placeholder="Ex: Itaú"
                                            style={{ height: '48px' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cód. Banco</label>
                                    <div className="relative">
                                        <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 ${modalMode === 'VIEW' ? 'text-slate-300' : 'text-slate-400'}`} size={16} />
                                        <input
                                            type="text"
                                            readOnly={modalMode === 'VIEW'}
                                            value={currentConta.numero_banco}
                                            onChange={(e) => setCurrentConta({ ...currentConta, numero_banco: e.target.value })}
                                            className={`w-full pl-10 pr-4 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none ${modalMode === 'VIEW' ? 'bg-gray-50 text-slate-600' : 'bg-white'}`}
                                            placeholder="341"
                                            style={{ height: '48px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Agência</label>
                                    <input
                                        type="text"
                                        required
                                        readOnly={modalMode === 'VIEW'}
                                        value={currentConta.agencia}
                                        onChange={(e) => setCurrentConta({ ...currentConta, agencia: e.target.value })}
                                        className={`w-full px-4 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none ${modalMode === 'VIEW' ? 'bg-gray-50 text-slate-600' : 'bg-white'}`}
                                        style={{ height: '48px' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Conta</label>
                                    <div className="relative">
                                        <CreditCard className={`absolute left-3 top-1/2 -translate-y-1/2 ${modalMode === 'VIEW' ? 'text-slate-300' : 'text-slate-400'}`} size={16} />
                                        <input
                                            type="text"
                                            required
                                            readOnly={modalMode === 'VIEW'}
                                            value={currentConta.conta}
                                            onChange={(e) => setCurrentConta({ ...currentConta, conta: e.target.value })}
                                            className={`w-full pl-10 pr-4 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none ${modalMode === 'VIEW' ? 'bg-gray-50 text-slate-600' : 'bg-white'}`}
                                            style={{ height: '48px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        disabled={modalMode === 'VIEW'}
                                        checked={currentConta.ativa}
                                        onChange={(e) => setCurrentConta({ ...currentConta, ativa: e.target.checked })}
                                    />
                                    <div className={`w-11 h-6 bg-gray-200 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${modalMode === 'VIEW' ? 'opacity-60' : 'peer-checked:bg-blue-600 peer-checked:after:translate-x-full'}`}></div>
                                </label>
                                <span className="text-sm font-medium text-slate-700">Conta Ativa?</span>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-gray-100 rounded-lg">
                                    {modalMode === 'VIEW' ? 'Fechar' : 'Cancelar'}
                                </button>
                                {modalMode !== 'VIEW' && (
                                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-lg flex items-center gap-2">
                                        <Save size={18} /> <span>{isSaving ? 'Salvando...' : 'Salvar Dados'}</span>
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModalOpen && contaToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="text-red-600" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Confirmar Exclusão</h3>
                            <p className="text-slate-600 text-sm mb-6">Tem certeza que deseja excluir esta conta?</p>
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
export default ContasCorrente;
