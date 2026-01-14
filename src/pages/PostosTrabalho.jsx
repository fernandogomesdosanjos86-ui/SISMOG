import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Search, Edit, Trash2, Building2, UserCheck, UserX, X, Save, Briefcase, AlertCircle, CheckCircle, Users, Clock, UserPlus, Shield, Moon, Sun } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const PostosTrabalho = () => {
    const [postos, setPostos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State - Edit/Create
    const INITIAL_POSTO = { empresa_id: '', nome_posto: '', ativo: true };
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPosto, setCurrentPosto] = useState(INITIAL_POSTO);
    const [isEditing, setIsEditing] = useState(false);

    // Feedback State
    const [feedbackModal, setFeedbackModal] = useState({ open: false, type: 'success', title: '', message: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [postoToDelete, setPostoToDelete] = useState(null);

    // View Modal State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedPosto, setSelectedPosto] = useState(null);

    // Filter States
    const [filterEmpresa, setFilterEmpresa] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Tab State
    const [activeTab, setActiveTab] = useState('dados'); // 'dados' | 'lotacao'

    // Lotação State
    const [lotacaoData, setLotacaoData] = useState([]);
    const [allFuncionarios, setAllFuncionarios] = useState([]); // Dropdown source
    const [loadingLotacao, setLoadingLotacao] = useState(false);
    const [newLotacao, setNewLotacao] = useState({
        funcionario_id: '',
        escala: '',
        turno: 'Diurno', // 'Diurno' | 'Noturno'
        is_extra: false
    });
    const [deleteLotacaoId, setDeleteLotacaoId] = useState(null);

    // Helpers
    const formatEmployeeName = (fullName) => {
        if (!fullName) return '';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 1) return parts[0];
        return `${parts[0]} ${parts[parts.length - 1]}`;
    };

    const getFuncionarioStripColor = (nomeEmpresa) => {
        const nome = (nomeEmpresa || '').toLowerCase();
        if (nome.includes('femog')) return '#2563eb'; // blue-600
        if (nome.includes('semog')) return '#f97316'; // orange-500
        return '#9ca3af'; // gray-400
    };

    useEffect(() => {
        fetchPostos();
        fetchEmpresas();
    }, []);

    const fetchPostos = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('postos_trabalho')
                .select('*, empresas(nome)')
                .order('nome_posto', { ascending: true });

            if (error) throw error;
            setPostos(data || []);
        } catch (error) {
            console.error('Erro ao buscar postos:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmpresas = async () => {
        try {
            const { data, error } = await supabase
                .from('empresas')
                .select('id, nome')
                .eq('ativo', true)
                .order('nome');
            if (error) throw error;
            setEmpresas(data || []);
        } catch (error) {
            console.error('Erro ao buscar empresas:', error.message);
        }
    };

    const fetchAllFuncionarios = async () => {
        try {
            const { data, error } = await supabase
                .from('funcionarios')
                .select('id, nome, empresas(nome), cargos_salarios(cargo)')
                .order('nome');
            if (error) throw error;
            setAllFuncionarios(data || []);
        } catch (error) {
            console.error('Erro ao buscar funcionários:', error.message);
        }
    };

    const fetchLotacao = async (postoId) => {
        try {
            setLoadingLotacao(true);
            const { data, error } = await supabase
                .from('lotacao_postos')
                .select(`
                    *,
                    funcionarios (
                        id, nome,
                        empresas (nome),
                        cargos_salarios (cargo)
                    )
                `)
                .eq('posto_id', postoId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLotacaoData(data || []);
        } catch (error) {
            console.error('Erro ao buscar lotação:', error.message);
        } finally {
            setLoadingLotacao(false);
        }
    };

    const handleSaveLotacao = async () => {
        if (!newLotacao.funcionario_id || !newLotacao.escala) {
            setFeedbackModal({ open: true, type: 'error', title: 'Campos Obrigatórios', message: 'Selecione um funcionário e informe a escala.' });
            return;
        }

        try {
            const { error } = await supabase
                .from('lotacao_postos')
                .insert([{
                    posto_id: currentPosto.id,
                    funcionario_id: newLotacao.funcionario_id,
                    escala: newLotacao.escala,
                    turno: newLotacao.turno,
                    is_extra: newLotacao.is_extra
                }]);

            if (error) throw error;

            await fetchLotacao(currentPosto.id);
            setNewLotacao(prev => ({ ...prev, funcionario_id: '' })); // KEEPS Escala/Turno/Extra for batch entry
            setFeedbackModal({ open: true, type: 'success', title: 'Sucesso!', message: 'Colaborador adicionado ao posto.' });
        } catch (error) {
            console.error('Erro ao salvar lotação:', error.message);
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        }
    };

    const handleDeleteLotacao = async (id) => {
        try {
            const { error } = await supabase
                .from('lotacao_postos')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await fetchLotacao(currentPosto.id);
            setFeedbackModal({ open: true, type: 'success', title: 'Removido!', message: 'Colaborador removido do posto.' });
        } catch (error) {
            console.error('Erro ao excluir lotação:', error.message);
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        }
    };

    const handleOpenModal = (posto = null) => {
        if (posto) {
            setCurrentPosto(posto);
            setIsEditing(true);
            setActiveTab('dados');
            fetchAllFuncionarios();
            fetchLotacao(posto.id);
        } else {
            setCurrentPosto({ empresa_id: '', nome_posto: '', ativo: true });
            setIsEditing(false);
            setActiveTab('dados');
            setLotacaoData([]);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentPosto(INITIAL_POSTO);
        setActiveTab('dados');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('postos_trabalho')
                    .update({
                        empresa_id: currentPosto.empresa_id,
                        nome_posto: currentPosto.nome_posto,
                        ativo: currentPosto.ativo
                    })
                    .eq('id', currentPosto.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('postos_trabalho')
                    .insert([{
                        empresa_id: currentPosto.empresa_id,
                        nome_posto: currentPosto.nome_posto,
                        ativo: currentPosto.ativo
                    }]);
                if (error) throw error;
            }
            fetchPostos();
            handleCloseModal();
            setFeedbackModal({ open: true, type: 'success', title: 'Sucesso!', message: 'Posto de trabalho salvo com sucesso!' });
        } catch (error) {
            console.error('Erro ao salvar posto:', error.message);
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (posto) => {
        setPostoToDelete(posto);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!postoToDelete) return;

        try {
            const { error } = await supabase
                .from('postos_trabalho')
                .delete()
                .eq('id', postoToDelete.id);

            if (error) throw error;

            setDeleteModalOpen(false);
            setPostoToDelete(null);
            fetchPostos();

            // Show success toast via Feedback Modal
            setFeedbackModal({ open: true, type: 'success', title: 'Sucesso!', message: 'Posto removido com sucesso!' });
        } catch (error) {
            console.error('Erro ao excluir posto:', error.message);
            alert('Erro ao excluir posto: ' + error.message);
        }
    };

    const handleRowClick = (posto) => {
        setSelectedPosto(posto);
        setViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setViewModalOpen(false);
        setSelectedPosto(null);
    };

    const getEmpresaColor = (nomeEmpresa) => {
        const nome = nomeEmpresa?.toLowerCase() || '';
        if (nome.includes('femog')) return 'bg-blue-50 text-blue-700 border-blue-100';
        if (nome.includes('semog')) return 'bg-orange-50 text-orange-700 border-orange-100';
        return 'bg-gray-50 text-slate-700 border-gray-100';
    };

    const getEmpresaStripColor = (nomeEmpresa) => {
        const nome = (nomeEmpresa || '').toLowerCase();
        if (nome.includes('femog')) return '#2563eb'; // blue-600
        if (nome.includes('semog')) return '#f97316'; // orange-500
        return '#9ca3af'; // gray-400
    };

    const stats = {
        total: postos.length,
        femog: postos.filter(p => p.ativo && (p.empresas?.nome || '').toLowerCase().includes('femog')).length,
        semog: postos.filter(p => p.ativo && (p.empresas?.nome || '').toLowerCase().includes('semog')).length
    };

    const filteredPostos = postos.filter(p => {
        const matchesSearch = (p.nome_posto || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEmpresa = filterEmpresa ? (p.empresas?.nome || '').toLowerCase().includes(filterEmpresa.toLowerCase()) : true;
        const matchesStatus = filterStatus ? (filterStatus === 'ativo' ? p.ativo : !p.ativo) : true;
        return matchesSearch && matchesEmpresa && matchesStatus;
    });

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="ml-0 md:ml-72 transition-all duration-300 flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden text-slate-900 relative">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Briefcase className="text-blue-600" /> Gestão de Postos de Trabalho
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Gerencie os locais de trabalho vinculados às empresas
                            </p>
                        </div>

                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/20 font-medium text-sm w-full md:w-auto"
                        >
                            <Plus size={18} />
                            <span>Novo Posto</span>
                        </button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total de Postos</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Building2 className="text-blue-600" size={24} />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Postos Femog (Ativos)</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.femog}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Building2 className="text-blue-600" size={24} />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Postos Semog (Ativos)</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stats.semog}</h3>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg">
                                <Building2 className="text-orange-600" size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Advanced Filters & Search */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                        <div className="relative w-full md:w-[40%]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nome do posto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-base"
                                style={{ height: '48px', paddingLeft: '45px', paddingRight: '16px' }}
                            />
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                            <select
                                value={filterEmpresa}
                                onChange={(e) => setFilterEmpresa(e.target.value)}
                                className="px-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                style={{ height: '48px' }}
                            >
                                <option value="">Todas Empresas</option>
                                <option value="femog">Femog</option>
                                <option value="semog">Semog</option>
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                style={{ height: '48px' }}
                            >
                                <option value="">Todos Status</option>
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
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
                                        <span>Carregando dados...</span>
                                    </div>
                                </div>
                            ) : filteredPostos.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    Nenhum posto encontrado com os filtros selecionados.
                                </div>
                            ) : (
                                filteredPostos.map((posto) => (
                                    <div key={posto.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getEmpresaStripColor(posto.empresas?.nome) }}></div>
                                        <div className="pl-3 flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-slate-800">{posto.nome_posto}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getEmpresaColor(posto.empresas?.nome)}`}>
                                                        {posto.empresas?.nome}
                                                    </span>
                                                </div>
                                            </div>
                                            {posto.ativo ?
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 flex items-center gap-1"><UserCheck size={10} /> Ativo</span> :
                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center gap-1"><UserX size={10} /> Inativo</span>
                                            }
                                        </div>

                                        <div className="pl-3 mt-4 pt-3 border-t border-slate-50 flex justify-end gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenModal(posto);
                                                }}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(posto);
                                                }}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* VIEW DESKTOP: TABLE */}
                        <div className="hidden md:block overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-semibold pl-6">Posto de Trabalho</th>
                                        <th className="p-4 font-semibold">Empresa</th>
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
                                                    <span>Carregando dados...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredPostos.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="p-8 text-center text-slate-500">
                                                Nenhum posto encontrado com os filtros selecionados.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPostos.map((posto) => (
                                            <tr
                                                key={posto.id}
                                                onClick={() => handleRowClick(posto)}
                                                className="hover:bg-gray-50 transition-colors group cursor-pointer relative"
                                            >
                                                <td className="relative p-0">
                                                    {/* Vertical Strip */}
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            left: 0,
                                                            top: 0,
                                                            bottom: 0,
                                                            width: '4px',
                                                            backgroundColor: getEmpresaStripColor(posto.empresas?.nome)
                                                        }}
                                                    ></div>
                                                    {/* Content */}
                                                    <div className="py-4 pr-4 font-normal text-slate-900" style={{ paddingLeft: '24px' }}>
                                                        {posto.nome_posto}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getEmpresaColor(posto.empresas?.nome)}`}>
                                                        {posto.empresas?.nome}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {posto.ativo ? (
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
                                                                handleOpenModal(posto);
                                                            }}
                                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteClick(posto);
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

                    {/* Success Toast */}

                </div>

                {/* View Modal */}
                {viewModalOpen && selectedPosto && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gray-50">
                                <h3 className="font-bold text-slate-800">Detalhes do Posto</h3>
                                <button onClick={handleCloseViewModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Empresa</label>
                                    <div className="text-sm text-slate-900">{selectedPosto.empresas?.nome}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Posto de Trabalho</label>
                                    <div className="text-sm text-slate-900">{selectedPosto.nome_posto}</div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                                    {selectedPosto.ativo ? (
                                        <span className="inline-flex items-center text-emerald-700 text-xs font-medium bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                            <UserCheck size={12} className="mr-1" /> Ativo
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center text-slate-500 text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                            <UserX size={12} className="mr-1" /> Inativo
                                        </span>
                                    )}
                                </div>
                            </div>

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

                {/* Delete Confirmation Modal */}
                {deleteModalOpen && postoToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="text-red-600" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Confirmar Exclusão</h3>
                                <p className="text-slate-600 text-sm mb-6">
                                    Tem certeza que deseja excluir o posto <strong>{postoToDelete.nome_posto}</strong>? Esta ação não pode ser desfeita.
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

                {/* Edit/Create Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100">
                            {/* Header */}
                            <div className="flex flex-col border-b border-slate-100 bg-white">
                                <div className="flex items-center justify-between p-4 pb-2">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                        {isEditing ? <Edit className="text-blue-600" size={20} /> : <Plus className="text-blue-600" size={20} />}
                                        {isEditing ? `Editar: ${currentPosto.nome_posto}` : 'Novo Posto de Trabalho'}
                                    </h3>
                                    <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* Tabs */}
                                <div className="flex px-4 gap-6">
                                    <button
                                        onClick={() => setActiveTab('dados')}
                                        className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'dados' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Dados Cadastrais
                                    </button>
                                    {isEditing && (
                                        <button
                                            onClick={() => setActiveTab('lotacao')}
                                            className={`pb-3 text-sm font-medium transition-all relative flex items-center gap-2 ${activeTab === 'lotacao' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            <Users size={16} />
                                            Lotação de Colaboradores
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="p-6">
                                {/* TAB: DADOS CADASTRAIS */}
                                {activeTab === 'dados' && (
                                    <form onSubmit={handleSave} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Empresa</label>
                                            <div className="relative">
                                                <select
                                                    required
                                                    value={currentPosto.empresa_id}
                                                    onChange={(e) => setCurrentPosto({ ...currentPosto, empresa_id: e.target.value })}
                                                    className="w-full px-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                    style={{ height: '48px' }}
                                                >
                                                    <option value="">Selecione uma empresa</option>
                                                    {empresas.map(emp => (
                                                        <option key={emp.id} value={emp.id}>{emp.nome}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome do Posto</label>
                                            <input
                                                type="text"
                                                required
                                                value={currentPosto.nome_posto}
                                                onChange={(e) => setCurrentPosto({ ...currentPosto, nome_posto: e.target.value })}
                                                className="w-full px-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                style={{ height: '48px' }}
                                                placeholder="Ex: Portaria Principal"
                                            />
                                        </div>

                                        <div className="flex items-center gap-3 pt-2">
                                            <label className="relative inline-flex items-center cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={currentPosto.ativo}
                                                    onChange={(e) => setCurrentPosto({ ...currentPosto, ativo: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-[#E5E7EB] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 group-hover:bg-gray-300 peer-checked:group-hover:bg-blue-700 transition-colors duration-200 ease-in-out after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:shadow-sm after:transition-all after:duration-200 after:ease-in-out peer-checked:after:translate-x-5"></div>
                                            </label>
                                            <span className="text-sm font-medium text-slate-700">Posto Ativo?</span>
                                        </div>

                                        <div className="pt-4 flex justify-end space-x-3 border-t border-slate-100 mt-4">
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
                                )}

                                {/* TAB: LOTAÇÃO */}
                                {activeTab === 'lotacao' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                        {/* Add Form */}
                                        <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-slate-300">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
                                                <UserPlus size={14} /> Adicionar Colaborador
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                                {/* Funcionario (Cols 5) */}
                                                <div className="md:col-span-5">
                                                    <select
                                                        value={newLotacao.funcionario_id}
                                                        onChange={(e) => setNewLotacao({ ...newLotacao, funcionario_id: e.target.value })}
                                                        className="w-full px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                        style={{ height: '48px' }}
                                                    >
                                                        <option value="">Selecione o Colaborador...</option>
                                                        {allFuncionarios.map(f => (
                                                            <option key={f.id} value={f.id}>
                                                                {f.nome} | {f.cargos_salarios?.cargo} | {f.empresas?.nome}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Escala (Cols 3) */}
                                                <div className="md:col-span-3">
                                                    <input
                                                        type="text"
                                                        value={newLotacao.escala}
                                                        onChange={(e) => setNewLotacao({ ...newLotacao, escala: e.target.value })}
                                                        placeholder="Escala (Ex: 12x36)"
                                                        className="w-full px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                        style={{ height: '48px' }}
                                                    />
                                                </div>

                                                {/* Turno (Cols 2) */}
                                                <div className="md:col-span-2">
                                                    <select
                                                        value={newLotacao.turno}
                                                        onChange={(e) => setNewLotacao({ ...newLotacao, turno: e.target.value })}
                                                        className="w-full px-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                                        style={{ height: '48px' }}
                                                    >
                                                        <option value="Diurno">Diurno</option>
                                                        <option value="Noturno">Noturno</option>
                                                    </select>
                                                </div>

                                                {/* Button (Cols 2) */}
                                                <div className="md:col-span-2 flex items-center gap-2">
                                                    <button
                                                        onClick={handleSaveLotacao}
                                                        className="w-full h-[48px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow flex items-center justify-center transition-all"
                                                        title="Adicionar"
                                                    >
                                                        <UserPlus size={20} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Extra Checkbox */}
                                            <div className="mt-3 flex items-center gap-2">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={newLotacao.is_extra}
                                                        onChange={(e) => setNewLotacao({ ...newLotacao, is_extra: e.target.checked })}
                                                        className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                                    />
                                                    <span className="text-sm font-medium text-slate-600">Posto Extra / Cobertura?</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* List */}
                                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="bg-gray-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                                        <tr>
                                                            <th className="p-4 pl-6 font-semibold">Colaborador</th>
                                                            <th className="p-4 font-semibold">Escala / Turno</th>
                                                            <th className="p-4 font-semibold">Tipo</th>
                                                            <th className="p-4 font-semibold text-right">Ações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {loadingLotacao ? (
                                                            <tr><td colSpan="4" className="p-8 text-center text-slate-500">Carregando...</td></tr>
                                                        ) : lotacaoData.length === 0 ? (
                                                            <tr><td colSpan="4" className="p-8 text-center text-slate-500">Nenhum colaborador lotado neste posto.</td></tr>
                                                        ) : (
                                                            lotacaoData.map(lota => (
                                                                <tr key={lota.id} className="hover:bg-gray-50 transition-colors relative group">
                                                                    <td className="relative p-0">
                                                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getFuncionarioStripColor(lota.funcionarios?.empresas?.nome) }}></div>
                                                                        <div className="py-3 pr-4 font-medium text-slate-900 flex flex-col" style={{ paddingLeft: '24px' }}>
                                                                            <span className="text-sm font-bold">{formatEmployeeName(lota.funcionarios?.nome)}</span>
                                                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                                                <Briefcase size={10} />
                                                                                {lota.funcionarios?.cargos_salarios?.cargo} • {lota.funcionarios?.empresas?.nome}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <div className="flex flex-col">
                                                                            <span className="text-sm font-bold text-slate-700">{lota.escala}</span>
                                                                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${lota.turno === 'Noturno' ? 'text-indigo-600' : 'text-orange-600'}`}>
                                                                                {lota.turno === 'Noturno' ? <Moon size={10} /> : <Sun size={10} />}
                                                                                {lota.turno}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        {lota.is_extra ? (
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                                                                EXTRA
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-slate-600 border border-gray-200">
                                                                                FIXO
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-4 text-right">
                                                                        <button
                                                                            onClick={() => {
                                                                                setDeleteLotacaoId(lota.id);
                                                                                handleDeleteLotacao(lota.id); // Simple delete for now, or add modal
                                                                            }}
                                                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                            title="Remover"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* Feedback Modal */}
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
            </div>
        </div>
    );
};

export default PostosTrabalho;
