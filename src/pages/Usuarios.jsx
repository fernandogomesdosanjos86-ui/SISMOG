import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Edit, Trash2, Search, UserCheck, UserX, Shield, CheckCircle, AlertCircle, AlertTriangle, Save, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';

// Configuração de Enums do Sistema SISMOG (DNA Visual para Faixas da Tabela)
const PERMISSOES = {
    1: { label: 'Administrador', color: 'bg-purple-100 text-purple-700 border-purple-200', strip: '#9333ea' }, // Purple
    2: { label: 'Gestor', color: 'bg-blue-100 text-blue-700 border-blue-200', strip: '#2563eb' }, // Blue
    3: { label: 'Financeiro', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', strip: '#059669' }, // Emerald
    4: { label: 'Operacional', color: 'bg-orange-100 text-orange-700 border-orange-200', strip: '#ea580c' }, // Orange
    5: { label: 'Visualizador', color: 'bg-slate-100 text-slate-700 border-slate-200', strip: '#64748b' }, // Slate
    6: { label: 'Básico', color: 'bg-gray-100 text-gray-700 border-gray-200', strip: '#9ca3af' }, // Gray
    7: { label: 'Sem Acesso', color: 'bg-red-50 text-red-600 border-red-100', strip: '#dc2626' }, // Red
};

const CATEGORIAS = ['Operador', 'Gestão'];

const Usuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('EDIT'); // 'EDIT' or 'VIEW'
    const [currentUser, setCurrentUser] = useState({ nome: '', categoria: 'Operador', permissao: 7, ativo: true });

    // Feedback & Delete Modals (Padrão SISMOG)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [feedbackModal, setFeedbackModal] = useState({ open: false, type: 'success', title: '', message: '' });

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const fetchUsuarios = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('usuarios')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsuarios(data || []);
        } catch (error) {
            console.error('Error fetching usuarios:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    const handleOpenModal = (user = null, mode = 'EDIT') => {
        setModalMode(mode);
        if (user) {
            setCurrentUser(user);
        } else {
            setCurrentUser({ nome: '', categoria: 'Operador', permissao: 7, ativo: true });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentUser({ nome: '', categoria: 'Operador', permissao: 7, ativo: true });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const userData = {
                nome: currentUser.nome,
                categoria: currentUser.categoria,
                permissao: parseInt(currentUser.permissao),
                ativo: currentUser.ativo
            };

            if (currentUser.id) {
                const { error } = await supabase
                    .from('usuarios')
                    .update(userData)
                    .eq('id', currentUser.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('usuarios')
                    .insert([userData]);
                if (error) throw error;
            }
            fetchUsuarios();
            handleCloseModal();
            setFeedbackModal({ open: true, type: 'success', title: 'Sucesso!', message: 'Dados do usuário salvos com sucesso.' });
        } catch (error) {
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        }
    };

    const handleDeleteClick = (user) => {
        setItemToDelete(user);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const { error } = await supabase
                .from('usuarios')
                .delete()
                .eq('id', itemToDelete.id);

            if (error) throw error;
            fetchUsuarios();
            setDeleteModalOpen(false);
            setItemToDelete(null);
            setFeedbackModal({ open: true, type: 'success', title: 'Excluído!', message: 'Usuário removido do sistema.' });
        } catch (error) {
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        }
    };

    const filteredUsuarios = usuarios.filter(user =>
        user.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getPermissaoConfig = (valor) => PERMISSOES[valor] || PERMISSOES[6];

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="ml-0 md:ml-72 transition-all duration-300 flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden text-slate-900 relative">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Shield className="text-blue-600" /> Gestão de Usuários
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Gerencie o acesso e níveis de permissão (1 a 7)
                            </p>
                        </div>

                        <button
                            onClick={() => handleOpenModal(null, 'EDIT')}
                            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/20 font-medium text-sm"
                        >
                            <Plus size={18} />
                            <span>Novo Usuário</span>
                        </button>
                    </div>

                    {/* Filters - Pixel Perfect 48px */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nome..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-base"
                                style={{ height: '48px', paddingLeft: '45px', paddingRight: '16px' }}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative">

                        {/* VIEW MOBILE: CARDS */}
                        <div className="block md:hidden space-y-3 p-3 bg-slate-50">
                            {loading ? (
                                <div className="p-8 text-center text-slate-500">
                                    <div className="flex justify-center items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Carregando users...</span>
                                    </div>
                                </div>
                            ) : filteredUsuarios.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    Nenhum usuário encontrado.
                                </div>
                            ) : (
                                filteredUsuarios.map((user) => {
                                    const permConfig = getPermissaoConfig(user.permissao);
                                    return (
                                        <div key={user.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: permConfig.strip }}></div>
                                            <div className="pl-3 flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{user.nome}</h4>
                                                    <span className="text-xs text-slate-500 uppercase">{user.categoria}</span>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${permConfig.color}`}>
                                                        {permConfig.label}
                                                    </span>
                                                    {user.ativo ?
                                                        <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><UserCheck size={10} /> Ativo</span> :
                                                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><UserX size={10} /> Inativo</span>
                                                    }
                                                </div>
                                            </div>

                                            <div className="pl-3 mt-4 pt-3 border-t border-slate-50 flex justify-end gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenModal(user, 'EDIT');
                                                    }}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClick(user);
                                                    }}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* VIEW DESKTOP: TABLE */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                                        <th className="p-4 font-semibold pl-6">Nome / Categoria</th>
                                        <th className="p-4 font-semibold">Permissão</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-slate-500">
                                                <div className="flex justify-center items-center space-x-2">
                                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <span>Carregando...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredUsuarios.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-slate-500">
                                                Nenhum usuário encontrado.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsuarios.map((user) => {
                                            const permConfig = getPermissaoConfig(user.permissao);
                                            return (
                                                <tr
                                                    key={user.id}
                                                    onClick={() => handleOpenModal(user, 'VIEW')} // View Mode by default on click
                                                    className="hover:bg-gray-50 transition-colors group cursor-pointer relative"
                                                >
                                                    <td className="relative p-0">
                                                        {/* Faixa Vertical por Linha (DNA SISMOG) */}
                                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: permConfig.strip }}></div>
                                                        <div className="py-4 pr-4 pl-6">
                                                            <div className="font-medium text-slate-900">{user.nome || 'N/A'}</div>
                                                            <div className="text-slate-500 text-xs mt-0.5">{user.categoria || '-'}</div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${permConfig.color}`}>
                                                            {permConfig.label}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        {user.ativo ? (
                                                            <span className="inline-flex items-center text-emerald-700 text-xs font-medium bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                                                <UserCheck size={12} className="mr-1" /> Ativo
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center text-slate-500 text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                                                <UserX size={12} className="mr-1" /> Inativo
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenModal(user, 'EDIT');
                                                                }}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteClick(user);
                                                                }}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Excluir"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Main Modal (Create/Edit/View) */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gray-50">
                                <h3 className="font-bold text-slate-800">
                                    {modalMode === 'VIEW' ? 'Detalhes do Usuário' : (currentUser.id ? 'Editar Usuário' : 'Novo Usuário')}
                                </h3>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={modalMode === 'VIEW'}
                                        value={currentUser.nome}
                                        onChange={(e) => setCurrentUser({ ...currentUser, nome: e.target.value })}
                                        className={`w-full px-3 h-12 border rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${modalMode === 'VIEW' ? 'bg-gray-50 border-slate-200 text-slate-600' : 'bg-white border-slate-300'}`}
                                        placeholder="Nome do usuário"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Categoria</label>
                                    <div className="relative">
                                        <select
                                            disabled={modalMode === 'VIEW'}
                                            value={currentUser.categoria}
                                            onChange={(e) => setCurrentUser({ ...currentUser, categoria: e.target.value })}
                                            className={`w-full px-3 h-12 border rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none transition-all ${modalMode === 'VIEW' ? 'bg-gray-50 border-slate-200 text-slate-600' : 'bg-white border-slate-300'}`}
                                        >
                                            {CATEGORIAS.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        {modalMode !== 'VIEW' && (
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Permissão</label>
                                    <div className="relative">
                                        <select
                                            disabled={modalMode === 'VIEW'}
                                            value={currentUser.permissao}
                                            onChange={(e) => setCurrentUser({ ...currentUser, permissao: parseInt(e.target.value) })}
                                            className={`w-full px-3 h-12 border rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none transition-all ${modalMode === 'VIEW' ? 'bg-gray-50 border-slate-200 text-slate-600' : 'bg-white border-slate-300'}`}
                                        >
                                            {Object.entries(PERMISSOES).map(([key, value]) => (
                                                <option key={key} value={key}>{key} - {value.label}</option>
                                            ))}
                                        </select>
                                        {modalMode !== 'VIEW' && (
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <label className="relative inline-flex items-center cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            disabled={modalMode === 'VIEW'}
                                            checked={currentUser.ativo}
                                            onChange={(e) => setCurrentUser({ ...currentUser, ativo: e.target.checked })}
                                        />
                                        <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-colors duration-200 ease-in-out after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:shadow-sm after:transition-all after:duration-200 after:ease-in-out peer-checked:after:translate-x-5 ${modalMode === 'VIEW' ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                                    </label>
                                    <span className="text-sm font-medium text-slate-700">Usuário Ativo?</span>
                                </div>

                                <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-2">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        {modalMode === 'VIEW' ? 'Fechar' : 'Cancelar'}
                                    </button>
                                    {modalMode !== 'VIEW' && (
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow hover:shadow-lg transition-all flex items-center space-x-2"
                                        >
                                            <Save size={16} />
                                            <span>Salvar Dados</span>
                                        </button>
                                    )}
                                    {modalMode === 'VIEW' && (
                                        <button
                                            type="button"
                                            onClick={() => setModalMode('EDIT')}
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow hover:shadow-lg transition-all flex items-center space-x-2"
                                        >
                                            <Edit size={16} />
                                            <span>Editar</span>
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Modal (Padrão SISMOG) */}
                {deleteModalOpen && itemToDelete && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="text-red-600" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">
                                    Excluir Usuário?
                                </h3>
                                <p className="text-slate-600 text-sm mb-6">
                                    Tem certeza que deseja excluir <strong>{itemToDelete.nome}</strong>? Esta ação não pode ser desfeita.
                                </p>
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
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                            <div className="p-6 text-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${feedbackModal.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                    {feedbackModal.type === 'success' ? <CheckCircle className="text-emerald-600" size={32} /> : <AlertCircle className="text-red-600" size={32} />}
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">{feedbackModal.title}</h3>
                                <p className="text-slate-600 text-sm mb-6">{feedbackModal.message}</p>
                                <button
                                    onClick={() => setFeedbackModal({ ...feedbackModal, open: false })}
                                    className={`w-full px-4 py-3 rounded-lg font-medium shadow-lg transition-all text-sm block text-white ${feedbackModal.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}
                                >
                                    Entendido
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Usuarios;
