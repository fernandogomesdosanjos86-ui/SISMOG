import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Search, Edit, Trash2, Building2, CheckCircle, XCircle, X, Save, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Empresas = () => {
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const INITIAL_STATE = { nome: '', regime_tributario: 'Simples Nacional', ativo: true };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEmpresa, setCurrentEmpresa] = useState(INITIAL_STATE);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Feedback & Delete States
    const [feedbackModal, setFeedbackModal] = useState({ open: false, type: 'success', title: '', message: '' });
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [empresaToDelete, setEmpresaToDelete] = useState(null);

    // View Modal State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);

    useEffect(() => {
        fetchEmpresas();
    }, []);

    const fetchEmpresas = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('empresas')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEmpresas(data || []);
        } catch (error) {
            console.error('Erro ao buscar empresas:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (empresa = null) => {
        if (empresa) {
            setCurrentEmpresa(empresa);
            setIsEditing(true);
        } else {
            setCurrentEmpresa({ nome: '', regime_tributario: 'Simples Nacional', ativo: true });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentEmpresa(INITIAL_STATE);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('empresas')
                    .update({
                        nome: currentEmpresa.nome,
                        regime_tributario: currentEmpresa.regime_tributario,
                        ativo: currentEmpresa.ativo
                    })
                    .eq('id', currentEmpresa.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('empresas')
                    .insert([{
                        nome: currentEmpresa.nome,
                        regime_tributario: currentEmpresa.regime_tributario,
                        ativo: currentEmpresa.ativo
                    }]);
                if (error) throw error;
            }
            fetchEmpresas();
            handleCloseModal();
            setFeedbackModal({ open: true, type: 'success', title: 'Sucesso!', message: 'Empresa salva com sucesso!' });
        } catch (error) {
            console.error('Erro ao salvar empresa:', error.message);
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (empresa) => {
        setEmpresaToDelete(empresa);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!empresaToDelete) return;
        try {
            const { error } = await supabase
                .from('empresas')
                .delete()
                .eq('id', empresaToDelete.id);

            if (error) throw error;
            fetchEmpresas();
            setDeleteModalOpen(false);
            setEmpresaToDelete(null);
            setFeedbackModal({ open: true, type: 'success', title: 'Sucesso!', message: 'Empresa removida com sucesso!' });
        } catch (error) {
            console.error('Erro ao excluir empresa:', error.message);
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        }
    };

    const getRegimeColors = (regime) => {
        switch (regime) {
            case 'Lucro Real':
                return 'bg-orange-50 text-orange-700 border-orange-100';
            case 'Lucro Presumido':
                return 'bg-green-50 text-green-700 border-green-100';
            case 'Simples Nacional':
            default:
                return 'bg-blue-50 text-blue-700 border-blue-100';
        }
    };

    const handleRowClick = (empresa) => {
        setSelectedEmpresa(empresa);
        setViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setViewModalOpen(false);
        setSelectedEmpresa(null);
    };

    const filteredEmpresas = empresas.filter(emp =>
        emp.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="ml-0 md:ml-72 transition-all duration-300 flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden text-slate-900">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Building2 className="text-blue-600" /> Gestão de Empresas
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Cadastre e gerencie as empresas do grupo
                            </p>
                        </div>

                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/20 font-medium text-sm"
                        >
                            <Plus size={18} />
                            <span>Nova Empresa</span>
                        </button>
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center space-x-4 shadow-sm">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nome da empresa..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-sm"
                                style={{ height: '48px', paddingLeft: '45px' }}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                        {/* VIEW MOBILE: CARDS */}
                        <div className="block md:hidden space-y-3 p-3 bg-slate-50">
                            {loading ? (
                                <div className="p-8 text-center text-slate-500">
                                    <div className="flex justify-center items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Carregando empresas...</span>
                                    </div>
                                </div>
                            ) : filteredEmpresas.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    Nenhuma empresa encontrada.
                                </div>
                            ) : (
                                filteredEmpresas.map((emp) => (
                                    <div key={emp.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: emp.nome.toLowerCase().includes('semog') ? '#f97316' : '#2563eb' }}></div>
                                        <div className="pl-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                                    <Building2 size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800">{emp.nome}</h4>
                                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] border ${getRegimeColors(emp.regime_tributario)}`}>
                                                        {emp.regime_tributario}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pl-3 mt-4 pt-3 border-t border-slate-50 flex justify-between items-center">
                                            {emp.ativo ?
                                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle size={12} /> Ativo</span> :
                                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><XCircle size={12} /> Inativo</span>
                                            }

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenModal(emp);
                                                    }}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(emp);
                                                    }}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* VIEW DESKTOP: TABLE */}
                        <div className="hidden md:block overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                                        <th className="p-4 font-semibold">Nome da Empresa</th>
                                        <th className="p-4 font-semibold">Regime Tributário</th>
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
                                                    <span>Carregando empresas...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredEmpresas.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-slate-500">
                                                Nenhuma empresa encontrada.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredEmpresas.map((emp) => (
                                            <tr
                                                key={emp.id}
                                                onClick={() => handleRowClick(emp)}
                                                className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                            >
                                                <td className="relative p-0">
                                                    <div style={{
                                                        position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                                                        backgroundColor: emp.nome.toLowerCase().includes('semog') ? '#f97316' : '#2563eb'
                                                    }}></div>
                                                    <div className="py-4 pr-4 pl-6 font-medium text-slate-700">{emp.nome}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getRegimeColors(emp.regime_tributario)}`}>
                                                        {emp.regime_tributario}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {emp.ativo ? (
                                                        <span className="inline-flex items-center text-emerald-700 text-xs font-medium bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                                            <CheckCircle size={12} className="mr-1" /> Ativo
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-slate-500 text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                                            <XCircle size={12} className="mr-1" /> Inativo
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenModal(emp);
                                                            }}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(emp);
                                                            }}
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

            {/* View Company Modal */}
            {viewModalOpen && selectedEmpresa && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gray-50">
                            {/* Title (Aligned Left/Center by flex-1 or just standard flow) */}
                            <h3 className="font-bold text-slate-800">
                                Detalhes da Empresa
                            </h3>

                            {/* Close Icon (Moved to Top Right) */}
                            <button onClick={handleCloseViewModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome da Empresa</label>
                                <div className="text-sm text-slate-900">{selectedEmpresa.nome}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Regime Tributário</label>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getRegimeColors(selectedEmpresa.regime_tributario)}`}>
                                    {selectedEmpresa.regime_tributario}
                                </span>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                                {selectedEmpresa.ativo ? (
                                    <span className="inline-flex items-center text-emerald-700 text-xs font-medium bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <CheckCircle size={12} className="mr-1" /> Ativo
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center text-slate-500 text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                        <XCircle size={12} className="mr-1" /> Inativo
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Footer with styled Close button */}
                        <div className="p-4 border-t border-slate-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={handleCloseViewModal}
                                className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/20 font-medium text-sm"
                            >
                                <span>Fechar</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gray-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Building2 size={20} className="text-blue-600" />
                                {isEditing ? 'Editar Empresa' : 'Nova Empresa'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome da Empresa</label>
                                <input
                                    type="text"
                                    required
                                    value={currentEmpresa.nome}
                                    onChange={(e) => setCurrentEmpresa({ ...currentEmpresa, nome: e.target.value })}
                                    className="w-full px-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    style={{ height: '48px' }}
                                    placeholder="Ex: Minha Empresa Ltda"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Regime Tributário</label>
                                <div className="relative">
                                    <select
                                        value={currentEmpresa.regime_tributario}
                                        onChange={(e) => setCurrentEmpresa({ ...currentEmpresa, regime_tributario: e.target.value })}
                                        className="w-full px-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                        style={{ height: '48px' }}
                                    >
                                        <option value="Lucro Real">Lucro Real</option>
                                        <option value="Lucro Presumido">Lucro Presumido</option>
                                        <option value="Simples Nacional">Simples Nacional</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <label className="relative inline-flex items-center cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={currentEmpresa.ativo}
                                        onChange={(e) => setCurrentEmpresa({ ...currentEmpresa, ativo: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-[#E5E7EB] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 group-hover:bg-gray-300 peer-checked:group-hover:bg-blue-700 transition-colors duration-200 ease-in-out after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:shadow-sm after:transition-all after:duration-200 after:ease-in-out peer-checked:after:translate-x-5"></div>
                                </label>
                                <span className="text-sm font-medium text-slate-700">Cadastro Ativo?</span>
                            </div>

                            <div className="pt-4 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow hover:shadow-lg transition-all flex items-center space-x-2"
                                >
                                    <Save size={16} />
                                    <span>Salvar Dados</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && empresaToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="text-red-600" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Confirmar Exclusão</h3>
                            <p className="text-slate-600 text-sm mb-6">
                                Tem certeza que deseja excluir a empresa <strong>{empresaToDelete.nome}</strong>?
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
                                    style={{ backgroundColor: '#dc2626', color: 'white' }}
                                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-lg shadow-red-500/30 transition-all text-sm block"
                                >
                                    Sim, Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {feedbackModal.open && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
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
        </div>
    );
};

export default Empresas;
