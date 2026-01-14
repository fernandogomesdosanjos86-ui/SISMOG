import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import { Plus, Search, Edit, Trash2, X, Save, CheckCircle, AlertCircle, AlertTriangle, Users, Briefcase, Phone, Mail, FileText } from 'lucide-react';

const Funcionarios = () => {
    const [funcionarios, setFuncionarios] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE', 'EDIT', 'VIEW'
    const [currentFuncionario, setCurrentFuncionario] = useState({
        empresa_id: '',
        nome: '',
        cargo_id: '',
        tipo_contrato: '',
        posto_trabalho: '',
        escala: '',
        telefone: '',
        email: '',
        banco_nome: '',
        banco_agencia: '',
        banco_conta: '',
        pix: ''
    });
    const [activeTab, setActiveTab] = useState('dados'); // 'dados' or 'penalidades'

    // Penalidades State (Nested in Modal)
    const [funcionarioPenalidades, setFuncionarioPenalidades] = useState([]);
    const [newPenalidade, setNewPenalidade] = useState({
        data_penalidade: '',
        tipo_penalidade: '',
        responsavel: '',
        arquivo_url: null
    });
    const [penalidadeFile, setPenalidadeFile] = useState(null);

    // Feedback & Delete Modals
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [penaltyToDelete, setPenaltyToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState('employee'); // 'employee' or 'penalty'
    const [feedbackModal, setFeedbackModal] = useState({ open: false, type: 'success', title: '', message: '' });

    // Penalty Editing State
    const [editingPenalidadeId, setEditingPenalidadeId] = useState(null);

    useEffect(() => {
        fetchFuncionarios();
        fetchEmpresas();
        fetchCargos();
    }, []);

    const fetchFuncionarios = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('funcionarios')
                .select('*, empresas(nome), cargos_salarios(cargo)')
                .order('nome');
            if (error) throw error;
            setFuncionarios(data || []);
        } catch (error) {
            console.error('Erro ao buscar funcionários:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmpresas = async () => {
        const { data } = await supabase.from('empresas').select('id, nome').eq('ativo', true).order('nome');
        setEmpresas(data || []);
    };

    const fetchCargos = async () => {
        const { data } = await supabase.from('cargos_salarios').select('id, cargo').order('cargo');
        setCargos(data || []);
    };

    const fetchPenalidades = async (funcionarioId) => {
        const { data, error } = await supabase
            .from('penalidades')
            .select('*')
            .eq('funcionario_id', funcionarioId)
            .order('data_penalidade', { ascending: false });
        if (!error) setFuncionarioPenalidades(data || []);
    };

    // Handlers
    const handleOpenModal = (func = null, mode = 'CREATE') => {
        setActiveTab('dados');
        setModalMode(mode);

        if (func) {
            setCurrentFuncionario({
                ...func,
                telefone: func.telefone || '',
                email: func.email || '',
                posto_trabalho: func.posto_trabalho || '',
                escala: func.escala || '',
                banco_nome: func.banco_nome || '',
                banco_agencia: func.banco_agencia || '',
                banco_conta: func.banco_conta || '',
                pix: func.pix || ''
            });
            fetchPenalidades(func.id);
        } else {
            setCurrentFuncionario({
                empresa_id: '', nome: '', cargo_id: '', tipo_contrato: '', posto_trabalho: '', escala: '',
                telefone: '', email: '', banco_nome: '', banco_agencia: '', banco_conta: '', pix: ''
            });
            setFuncionarioPenalidades([]);
        }
        setIsModalOpen(true);
    };

    const handleSaveFuncionario = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...currentFuncionario };
            delete payload.empresas; // Remove joined data
            delete payload.cargos_salarios; // Remove joined data

            if (modalMode === 'EDIT') {
                const { error } = await supabase.from('funcionarios').update(payload).eq('id', currentFuncionario.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('funcionarios').insert([payload]);
                if (error) throw error;
            }
            fetchFuncionarios();
            setIsModalOpen(false);
            setFeedbackModal({ open: true, type: 'success', title: 'Sucesso!', message: 'Dados do funcionário salvos.' });
        } catch (error) {
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        }
    };

    const handleSavePenalidade = async (e) => {
        e.preventDefault();
        if (modalMode === 'CREATE') {
            setFeedbackModal({ open: true, type: 'error', title: 'Atenção', message: 'Salve o funcionário antes de adicionar penalidades.' });
            return;
        }

        try {
            let fileUrl = null;
            if (penalidadeFile) {
                const fileExt = penalidadeFile.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('penalidades_docs').upload(fileName, penalidadeFile);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('penalidades_docs').getPublicUrl(fileName);
                fileUrl = data.publicUrl;
            }

            const payload = {
                data_penalidade: newPenalidade.data_penalidade,
                tipo_penalidade: newPenalidade.tipo_penalidade,
                responsavel: newPenalidade.responsavel,
                funcionario_id: currentFuncionario.id,
                empresa_id: currentFuncionario.empresa_id,
                ...(fileUrl && { arquivo_url: fileUrl })
            };

            if (editingPenalidadeId) {
                const { error } = await supabase.from('penalidades').update(payload).eq('id', editingPenalidadeId);
                if (error) throw error;
                setFeedbackModal({ open: true, type: 'success', title: 'Sucesso!', message: 'Penalidade atualizada.' });
            } else {
                const { error } = await supabase.from('penalidades').insert([payload]);
                if (error) throw error;
                setFeedbackModal({ open: true, type: 'success', title: 'Sucesso!', message: 'Penalidade registrada.' });
            }

            fetchPenalidades(currentFuncionario.id);
            setNewPenalidade({ data_penalidade: '', tipo_penalidade: '', responsavel: '', arquivo_url: null });
            setPenalidadeFile(null);
            setEditingPenalidadeId(null);
        } catch (error) {
            console.error(error);
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        }
    };

    const handleEditPenalidade = (penalty) => {
        setNewPenalidade({
            data_penalidade: penalty.data_penalidade,
            tipo_penalidade: penalty.tipo_penalidade,
            responsavel: penalty.responsavel,
            arquivo_url: penalty.arquivo_url
        });
        setEditingPenalidadeId(penalty.id);
    };

    const cancelEditPenalidade = () => {
        setNewPenalidade({ data_penalidade: '', tipo_penalidade: '', responsavel: '', arquivo_url: null });
        setPenalidadeFile(null);
        setEditingPenalidadeId(null);
    };

    const handleDeletePenalidade = async () => {
        if (!penaltyToDelete) return;
        try {
            const { error } = await supabase.from('penalidades').delete().eq('id', penaltyToDelete.id);
            if (error) throw error;
            fetchPenalidades(currentFuncionario.id);
            setDeleteModalOpen(false);
            setPenaltyToDelete(null);
            setFeedbackModal({ open: true, type: 'success', title: 'Excluído!', message: 'Penalidade removida.' });
        } catch (error) {
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        }
    };

    const handleDeleteFuncionario = async () => {
        if (!itemToDelete) return;
        try {
            const { error } = await supabase.from('funcionarios').delete().eq('id', itemToDelete.id);
            if (error) throw error;
            fetchFuncionarios();
            setDeleteModalOpen(false);
            setItemToDelete(null);
            setFeedbackModal({ open: true, type: 'success', title: 'Excluído!', message: 'Funcionário removido.' });
        } catch (error) {
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        }
    };

    const getEmpresaStripColor = (nomeEmpresa) => {
        const nome = (nomeEmpresa || '').toLowerCase();
        if (nome.includes('femog')) return '#2563eb';
        if (nome.includes('semog')) return '#f97316';
        return '#9ca3af';
    };

    const filteredFuncionarios = funcionarios.filter(f => f.nome.toLowerCase().includes(searchTerm.toLowerCase()));

    // Helper para input style dependendo do modo
    const getInputClass = () => `w-full px-3 py-2 border rounded-lg text-sm transition-colors outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${modalMode === 'VIEW' ? 'bg-gray-50 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white border-slate-300 text-slate-900'}`;

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="ml-0 md:ml-72 transition-all duration-300 flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden text-slate-900">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <Users className="text-blue-600" /> Gestão de Funcionários
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">Gerencie contratos, dados e penalidades</p>
                        </div>
                        <button onClick={() => handleOpenModal(null, 'CREATE')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all font-medium text-sm">
                            <Plus size={18} /> Novo Funcionário
                        </button>
                    </div>

                    {/* Filter */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nome..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-base"
                                style={{ height: '48px', paddingLeft: '45px', paddingRight: '16px' }}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    {/* --- LISTAGEM: CARDS (MOBILE) vs TABELA (DESKTOP) --- */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                        {/* VIEW MOBILE: CARDS */}
                        <div className="block md:hidden divide-y divide-slate-100">
                            {filteredFuncionarios.map(f => (
                                <div key={f.id} className="relative p-4 flex flex-col gap-3 bg-white">
                                    {/* Faixa Vertical de Status */}
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: f.empresas?.nome.toLowerCase().includes('femog') ? '#2563eb' : '#f97316' }}></div>

                                    <div className="pl-3 flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-slate-800 text-sm">{f.nome}</div>
                                            <div className="text-xs text-slate-500 font-medium uppercase mt-0.5 tracking-wide">
                                                {f.cargos_salarios?.cargo || '-'}
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border ${f.empresas?.nome.toLowerCase().includes('femog') ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                                            }`}>
                                            {f.empresas?.nome || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="pl-3 grid grid-cols-2 gap-2 mt-1">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">CPF</p>
                                            <p className="text-xs text-slate-700 font-mono">{f.cpf || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">Telefone</p>
                                            <p className="text-xs text-slate-700">{f.telefone || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="pl-3 flex items-center justify-end gap-2 mt-2 pt-3 border-t border-slate-50">
                                        <button
                                            onClick={() => handleOpenModal(f, 'EDIT')}
                                            className="flex-1 py-2 flex items-center justify-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-xs font-bold"
                                        >
                                            <Edit size={14} /> EDITAR
                                        </button>
                                        <button
                                            onClick={() => { setItemToDelete(f); setDeleteType('employee'); setDeleteModalOpen(true); }}
                                            className="flex-none p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* VIEW DESKTOP: TABELA PADRÃO */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-semibold pl-6">Colaborador</th>
                                        <th className="p-4 font-semibold">Cargo</th>
                                        <th className="p-4 font-semibold">Empresa</th>
                                        <th className="p-4 font-semibold">Contrato</th>
                                        <th className="p-4 font-semibold text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (<tr><td colSpan="5" className="p-8 text-center text-slate-500">Carregando...</td></tr>) :
                                        filteredFuncionarios.length === 0 ? (<tr><td colSpan="5" className="p-8 text-center text-slate-500">Nenhum funcionário encontrado.</td></tr>) :
                                            filteredFuncionarios.map(func => (
                                                <tr key={func.id} onClick={() => handleOpenModal(func, 'VIEW')} className="hover:bg-gray-50 cursor-pointer transition-colors group relative">
                                                    <td className="relative p-0">
                                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getEmpresaStripColor(func.empresas?.nome) }}></div>
                                                        <div className="py-4 pr-4 pl-6 text-slate-700 text-sm">
                                                            {func.nome}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-600">
                                                        <div className="flex items-center gap-1">
                                                            <Briefcase size={14} className="text-slate-400" />
                                                            {func.cargos_salarios?.cargo || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-600">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${func.empresas?.nome.toLowerCase().includes('femog') ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                                            {func.empresas?.nome}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm">
                                                        <span className="bg-gray-100 text-slate-600 px-2 py-1 rounded-md text-xs border border-gray-200 font-medium">
                                                            {func.tipo_contrato || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                                                        <div className="flex justify-end gap-2">
                                                            <button onClick={(e) => { e.stopPropagation(); handleOpenModal(func, 'EDIT'); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit size={16} /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); setItemToDelete(func); setDeleteType('employee'); setDeleteModalOpen(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
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

            {/* Main Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col transform transition-all scale-100">
                        <div className="p-4 border-b border-slate-100 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                {modalMode === 'CREATE' ? 'Novo Funcionário' : (modalMode === 'EDIT' ? 'Editar Funcionário' : 'Detalhes do Funcionário')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-200 p-1 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        {/* Tabs (Apenas se não for criar, ou se for criar e já tiver salvo? Na criação só 'dados' faz sentido) */}
                        {modalMode !== 'CREATE' && (
                            <div className="flex border-b border-slate-200 bg-white sticky top-[60px] z-10">
                                <button onClick={() => setActiveTab('dados')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'dados' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'}`}>Dados Cadastrais</button>
                                <button onClick={() => setActiveTab('penalidades')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'penalidades' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-gray-50'}`}>Histórico de Penalidades</button>
                            </div>
                        )}

                        <div className="p-6">
                            {activeTab === 'dados' ? (
                                <form onSubmit={handleSaveFuncionario} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Basic Info */}
                                        <div className="col-span-2"><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-2">Informações Pessoais</h4></div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Empresa</label>
                                            <select required disabled={modalMode === 'VIEW'} value={currentFuncionario.empresa_id} onChange={e => setCurrentFuncionario({ ...currentFuncionario, empresa_id: e.target.value })} className={getInputClass()}>
                                                <option value="">Selecione...</option>
                                                {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome Completo</label>
                                            <input type="text" required disabled={modalMode === 'VIEW'} value={currentFuncionario.nome} onChange={e => setCurrentFuncionario({ ...currentFuncionario, nome: e.target.value })} className={getInputClass()} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cargo</label>
                                            <select required disabled={modalMode === 'VIEW'} value={currentFuncionario.cargo_id} onChange={e => setCurrentFuncionario({ ...currentFuncionario, cargo_id: e.target.value })} className={getInputClass()}>
                                                <option value="">Selecione...</option>
                                                {cargos.map(c => <option key={c.id} value={c.id}>{c.cargo}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo Contrato</label>
                                            <select disabled={modalMode === 'VIEW'} value={currentFuncionario.tipo_contrato} onChange={e => setCurrentFuncionario({ ...currentFuncionario, tipo_contrato: e.target.value })} className={getInputClass()}>
                                                <option value="">Selecione...</option>
                                                {['Mensalista', 'Intermitente', 'Prazo Determinado', 'Prolabore', 'Estagiário', 'Menor Aprendiz', 'Sem Remuneração'].map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </div>

                                        {/* Contact & Job */}
                                        <div className="col-span-2 mt-2"><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-2">Contato e Alocação</h4></div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Telefone</label>
                                            <input type="text" disabled={modalMode === 'VIEW'} value={currentFuncionario.telefone} onChange={e => setCurrentFuncionario({ ...currentFuncionario, telefone: e.target.value })} className={getInputClass()} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</label>
                                            <input type="email" disabled={modalMode === 'VIEW'} value={currentFuncionario.email} onChange={e => setCurrentFuncionario({ ...currentFuncionario, email: e.target.value })} className={getInputClass()} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Posto de Trabalho</label>
                                            <input type="text" disabled={modalMode === 'VIEW'} value={currentFuncionario.posto_trabalho} onChange={e => setCurrentFuncionario({ ...currentFuncionario, posto_trabalho: e.target.value })} className={getInputClass()} placeholder={modalMode === 'VIEW' ? '' : "Ex: Portaria Principal"} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Escala</label>
                                            <input type="text" disabled={modalMode === 'VIEW'} value={currentFuncionario.escala} onChange={e => setCurrentFuncionario({ ...currentFuncionario, escala: e.target.value })} className={getInputClass()} placeholder={modalMode === 'VIEW' ? '' : "Ex: 12x36"} />
                                        </div>

                                        {/* Financial */}
                                        <div className="col-span-2 mt-2"><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-2">Dados Bancários</h4></div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Banco</label>
                                            <input type="text" disabled={modalMode === 'VIEW'} value={currentFuncionario.banco_nome} onChange={e => setCurrentFuncionario({ ...currentFuncionario, banco_nome: e.target.value })} className={getInputClass()} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Agência</label>
                                            <input type="text" disabled={modalMode === 'VIEW'} value={currentFuncionario.banco_agencia} onChange={e => setCurrentFuncionario({ ...currentFuncionario, banco_agencia: e.target.value })} className={getInputClass()} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Conta</label>
                                            <input type="text" disabled={modalMode === 'VIEW'} value={currentFuncionario.banco_conta} onChange={e => setCurrentFuncionario({ ...currentFuncionario, banco_conta: e.target.value })} className={getInputClass()} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Chave Pix</label>
                                            <input type="text" disabled={modalMode === 'VIEW'} value={currentFuncionario.pix} onChange={e => setCurrentFuncionario({ ...currentFuncionario, pix: e.target.value })} className={getInputClass()} />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors">
                                            {modalMode === 'VIEW' ? 'Fechar' : 'Cancelar'}
                                        </button>

                                        {modalMode === 'VIEW' && (
                                            <button
                                                type="button"
                                                onClick={() => setModalMode('EDIT')}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow text-sm font-medium flex items-center gap-2 transition-all"
                                            >
                                                <Edit size={16} /> Editar
                                            </button>
                                        )}

                                        {modalMode !== 'VIEW' && (
                                            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow text-sm font-medium flex items-center gap-2 transition-all">
                                                <Save size={16} /> Salvar Funcionário
                                            </button>
                                        )}
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    {/* Penalidades List */}
                                    <div className="space-y-4">
                                        {modalMode !== 'VIEW' && (
                                            <>
                                                <div className="flex justify-between items-center">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{editingPenalidadeId ? 'Editar Penalidade' : 'Nova Penalidade'}</h4>
                                                    {editingPenalidadeId && (
                                                        <button onClick={cancelEditPenalidade} className="text-xs text-red-600 hover:text-red-700 hover:underline">
                                                            Cancelar Edição
                                                        </button>
                                                    )}
                                                </div>

                                                <form onSubmit={handleSavePenalidade} className="bg-slate-50 p-6 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden">
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tipo de Penalidade</label>
                                                        <select required value={newPenalidade.tipo_penalidade} onChange={e => setNewPenalidade({ ...newPenalidade, tipo_penalidade: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                                            <option value="">Selecione...</option>
                                                            <option value="Advertência Verbal">Advertência Verbal</option>
                                                            <option value="Advertência Escrita">Advertência Escrita</option>
                                                            <option value="Suspensão">Suspensão</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data</label>
                                                        <input type="date" required value={newPenalidade.data_penalidade} onChange={e => setNewPenalidade({ ...newPenalidade, data_penalidade: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Responsável</label>
                                                        <input type="text" required value={newPenalidade.responsavel} onChange={e => setNewPenalidade({ ...newPenalidade, responsavel: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="Quem aplicou?" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Arquivo (PDF/IMG)</label>
                                                        <input type="file" onChange={e => setPenalidadeFile(e.target.files[0])} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                                    </div>
                                                    <div className="col-span-1 md:col-span-2 flex justify-end mt-2">
                                                        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg shadow-blue-500/30 text-sm font-medium flex items-center gap-2 transition-all">
                                                            {editingPenalidadeId ? <Save size={16} /> : <AlertTriangle size={16} />}
                                                            {editingPenalidadeId ? 'Salvar Alterações' : 'Registrar Penalidade'}
                                                        </button>
                                                    </div>
                                                </form>
                                            </>
                                        )}

                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-8 mb-4">Histórico Registrado</h4>
                                        <div className="space-y-3">
                                            {funcionarioPenalidades.length === 0 ? (
                                                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                                    <p className="text-sm text-slate-500">Nenhuma penalidade registrada para este funcionário.</p>
                                                </div>
                                            ) : (
                                                funcionarioPenalidades.map(p => (
                                                    <div key={p.id} className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors">
                                                        <div>
                                                            <div className="font-bold text-slate-800 text-sm flex items-center gap-2"><AlertCircle size={14} className="text-orange-500" /> {p.tipo_penalidade}</div>
                                                            <div className="text-xs text-slate-500 mt-1 flex gap-2">
                                                                <span>Data: {new Date(p.data_penalidade).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                                                <span>•</span>
                                                                <span>Resp: {p.responsavel}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {p.arquivo_url && (
                                                                <a href={p.arquivo_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver Arquivo">
                                                                    <FileText size={16} />
                                                                </a>
                                                            )}
                                                            {modalMode !== 'VIEW' && (
                                                                <>
                                                                    <button onClick={() => handleEditPenalidade(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                                                        <Edit size={16} />
                                                                    </button>
                                                                    <button onClick={() => { setPenaltyToDelete(p); setDeleteType('penalty'); setDeleteModalOpen(true); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModalOpen && (itemToDelete || penaltyToDelete) && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="text-red-600" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">
                                {deleteType === 'employee' ? 'Excluir funcionário?' : 'Excluir penalidade?'}
                            </h3>
                            <p className="text-slate-600 text-sm mb-6">
                                {deleteType === 'employee'
                                    ? 'Esta ação removerá também todo o histórico de penalidades associado.'
                                    : 'Esta ação não pode ser desfeita.'}
                            </p>
                            <div className="grid grid-cols-2 gap-3 w-full">
                                <button onClick={() => setDeleteModalOpen(false)} className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-medium transition-colors text-sm">Cancelar</button>
                                <button onClick={deleteType === 'employee' ? handleDeleteFuncionario : handleDeletePenalidade} className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-lg shadow-red-500/30 transition-all text-sm block">Sim, Excluir</button>
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
    );
};

export default Funcionarios;
