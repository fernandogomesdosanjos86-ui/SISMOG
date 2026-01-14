import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Search, Edit, Trash2, Building2, UserCheck, UserX, X, Save, FileText, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Contratos = () => {
    const [contratos, setContratos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [postos, setPostos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State - Edit/Create
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentContrato, setCurrentContrato] = useState({
        empresa_id: '',
        posto_trabalho_id: '',
        ativo: true,
        valor_base_mensal: '',
        dia_vencimento_padrao: '',
        dia_faturamento: '',
        data_inicio: '',
        duracao_meses: '',
        aliquota_iss: '0.00',
        retem_iss: false,
        retem_pis: false,
        retem_cofins: false,
        retem_csll: false,
        retem_irpj: false,
        retem_inss: false,
        retem_caucao: false,
        aliquota_caucao: '0.00'
    });
    const [isEditing, setIsEditing] = useState(false);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [contratoToDelete, setContratoToDelete] = useState(null);
    const [showSuccessToast, setShowSuccessToast] = useState(false);

    // View Modal State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedContrato, setSelectedContrato] = useState(null);

    // Filter States
    const [filterEmpresa, setFilterEmpresa] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Feedback Modal State
    // Feedback Modal State (Errors only)
    const [feedbackModal, setFeedbackModal] = useState({ open: false, type: 'success', title: '', message: '' });

    // Success Modal State (Dedicated)
    const [successModal, setSuccessModal] = useState({ open: false, message: '' });

    useEffect(() => {
        fetchContratos();
        fetchEmpresas();
        fetchPostos();
    }, []);

    const fetchContratos = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('contratos')
                .select(`
                    *,
                    empresas (nome),
                    postos_trabalho (nome_posto)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContratos(data || []);
        } catch (error) {
            console.error('Erro ao buscar contratos:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmpresas = async () => {
        try {
            const { data, error } = await supabase.from('empresas').select('id, nome').eq('ativo', true).order('nome');
            if (error) throw error;
            setEmpresas(data || []);
        } catch (error) { console.error('Erro empresas:', error); }
    };

    const fetchPostos = async () => {
        try {
            const { data, error } = await supabase.from('postos_trabalho').select('id, nome_posto, empresa_id').eq('ativo', true).order('nome_posto');
            if (error) throw error;
            setPostos(data || []);
        } catch (error) { console.error('Erro postos:', error); }
    };

    const handleOpenModal = (contrato = null) => {
        if (contrato) {
            setCurrentContrato(contrato);
            setIsEditing(true);
        } else {
            setCurrentContrato({
                empresa_id: '',
                posto_trabalho_id: '',
                ativo: true,
                valor_base_mensal: '',
                dia_vencimento_padrao: '',
                dia_faturamento: '',
                data_inicio: '',
                duracao_meses: '',
                aliquota_iss: '0.00',
                retem_iss: false,
                retem_pis: false,
                retem_cofins: false,
                retem_csll: false,
                retem_irpj: false,
                retem_inss: false,
                retem_caucao: false,
                aliquota_caucao: '0.00'
            });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentContrato({ empresa_id: '', ativo: true }); // Reset minimal
    };

    const handleOpenViewModal = (contrato) => {
        setSelectedContrato(contrato);
        setViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setViewModalOpen(false);
        setSelectedContrato(null);
    };


    const handleSave = async (e) => {
        e.preventDefault();

        // Manual Validation
        if (!currentContrato.empresa_id || !currentContrato.posto_trabalho_id) {
            setFeedbackModal({ open: true, type: 'error', title: 'Atenção!', message: "Por favor, preencha a Empresa e o Posto de Trabalho." });
            return;
        }

        try {
            // Prepare payload: remove joined objects and system fields
            const { empresas, postos_trabalho, id, created_at, ...cleanedPayload } = currentContrato;

            // Ensure numerics
            const payload = {
                ...cleanedPayload,
                valor_base_mensal: parseFloat(cleanedPayload.valor_base_mensal),
                dia_vencimento_padrao: parseInt(cleanedPayload.dia_vencimento_padrao),
                dia_faturamento: parseInt(cleanedPayload.dia_faturamento),
                duracao_meses: parseInt(cleanedPayload.duracao_meses),
                aliquota_iss: parseFloat(cleanedPayload.aliquota_iss),
                aliquota_caucao: parseFloat(cleanedPayload.aliquota_caucao)
            };

            if (isNaN(payload.valor_base_mensal)) throw new Error("Valor Base inválido");
            if (isNaN(payload.dia_vencimento_padrao)) throw new Error("Dia de Vencimento inválido");

            if (isEditing) {
                // For update, we use the ID from currentContrato but don't include it in the body
                const { error } = await supabase.from('contratos').update(payload).eq('id', currentContrato.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('contratos').insert([payload]);
                if (error) throw error;
            }
            handleSaveSuccess();
        } catch (error) {
            console.error('Erro ao salvar:', error.message);
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: 'Erro ao salvar contrato: ' + error.message });
        }
    };

    const handleSaveSuccess = () => {
        fetchContratos();
        handleCloseModal();
        setSuccessModal({
            open: true,
            message: isEditing ? 'Contrato atualizado com sucesso!' : 'Novo contrato criado com sucesso!'
        });
    };

    const handleDeleteClick = (contrato) => {
        setContratoToDelete(contrato);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!contratoToDelete) return;
        try {
            const { error } = await supabase.from('contratos').delete().eq('id', contratoToDelete.id);
            if (error) throw error;
            setDeleteModalOpen(false);
            setContratoToDelete(null);
            fetchContratos();
            setFeedbackModal({ open: true, type: 'success', title: 'Sucesso!', message: 'Contrato excluído com sucesso!' });
            // setTimeout(() => setShowSuccessToast(false), 3000); // Removed toast logic in favor of modal
        } catch (error) {
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: 'Erro ao excluir: ' + error.message });
        }
    };

    // Helper for filtered postos based on selected empresa
    const availablePostos = currentContrato.empresa_id
        ? postos.filter(p => p.empresa_id === currentContrato.empresa_id)
        : [];

    const getEmpresaColor = (nomeEmpresa) => {
        const nome = (nomeEmpresa || '').toLowerCase();
        if (nome.includes('femog')) return 'bg-blue-50 text-blue-700 border-blue-100';
        if (nome.includes('semog')) return 'bg-orange-50 text-orange-700 border-orange-100';
        return 'bg-gray-50 text-slate-700 border-gray-100';
    };

    const getEmpresaStripColor = (nomeEmpresa) => {
        const nome = (nomeEmpresa || '').toLowerCase();
        if (nome.includes('femog')) return '#2563eb';
        if (nome.includes('semog')) return '#f97316';
        return '#9ca3af';
    };

    const calculateEndDate = (startDate, months) => {
        if (!startDate || !months) return '';
        const date = new Date(startDate);
        // Correcting timezone offset issue for display
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

        adjustedDate.setMonth(adjustedDate.getMonth() + parseInt(months));
        adjustedDate.setDate(adjustedDate.getDate() - 1);
        return adjustedDate.toLocaleDateString('pt-BR');
    };

    const getDeadlineStatus = (startDate, months) => {
        if (!startDate || !months) return { text: '-', color: 'text-slate-400' };

        const start = new Date(startDate);
        const end = new Date(start);
        end.setMonth(end.getMonth() + parseInt(months));
        end.setDate(end.getDate() - 1);

        const now = new Date();
        const diffTime = end - now;
        const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44); // Approx month

        let color = 'text-emerald-600';
        let fontWeight = 'font-normal';

        if (diffMonths < 3) {
            color = 'text-red-600';
            fontWeight = 'font-bold';
        } else if (diffMonths < 6) {
            color = 'text-orange-600';
            fontWeight = 'font-medium';
        }

        const monthsLeft = Math.ceil(diffMonths);
        const text = monthsLeft <= 0 ? 'Vencido' : `${monthsLeft} meses`;

        return { text, color, fontWeight };
    };

    const filteredContratos = contratos.filter(c => {
        const matchesSearch = (c.postos_trabalho?.nome_posto || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEmpresa = filterEmpresa ? (c.empresas?.nome || '').toLowerCase().includes(filterEmpresa.toLowerCase()) : true;
        const matchesStatus = filterStatus ? (filterStatus === 'ativo' ? c.ativo : !c.ativo) : true;
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
                                <FileText className="text-blue-600" /> Gestão de Contratos
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Configure as regras financeiras e tributárias de cada posto
                            </p>
                        </div>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/20 font-medium text-sm"
                        >
                            <Plus size={18} />
                            <span>Novo Contrato</span>
                        </button>
                    </div>

                    {/* Filter Bar (Pixel Perfect) */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 shadow-sm">
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
                            {filteredContratos.map((contrato) => (
                                <div key={contrato.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getEmpresaStripColor(contrato.empresas?.nome) }}></div>
                                    <div className="pl-3 mb-2">
                                        <h4 className="font-bold text-slate-800 leading-tight">{contrato.postos_trabalho?.nome_posto || 'Sem Posto'}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getEmpresaColor(contrato.empresas?.nome)}`}>
                                                {contrato.empresas?.nome}
                                            </span>
                                            {contrato.ativo ?
                                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><UserCheck size={10} /> Ativo</span> :
                                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><UserX size={10} /> Inativo</span>
                                            }
                                        </div>
                                    </div>
                                    <div className="pl-3 mt-3 flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                        <span className="text-xs text-slate-500 font-medium">Valor Base</span>
                                        <span className="font-bold text-slate-800">R$ {parseFloat(contrato.valor_base_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    {/* Botões de Ação */}
                                    <div className="pl-3 mt-3 pt-3 border-t border-slate-50 flex justify-end gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(contrato); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(contrato); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* VIEW DESKTOP: TABLE */}
                        <div className="hidden md:block overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-semibold pl-6">Posto (Contrato)</th>
                                        <th className="p-4 font-semibold">Empresa</th>
                                        <th className="p-4 font-semibold">Valor Base</th>
                                        <th className="p-4 font-semibold">Prazo</th>
                                        <th className="p-4 font-semibold">Dia Emissão</th>
                                        <th className="p-4 font-semibold">Vencimento</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredContratos.map((contrato) => (
                                        <tr key={contrato.id} onClick={() => handleOpenViewModal(contrato)} className="hover:bg-gray-50 transition-colors group relative cursor-pointer">
                                            <td className="relative p-0">
                                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getEmpresaStripColor(contrato.empresas?.nome) }}></div>
                                                <div className="py-4 pr-4 font-normal text-slate-900" style={{ paddingLeft: '24px' }}>
                                                    {contrato.postos_trabalho?.nome_posto || 'Sem Posto'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getEmpresaColor(contrato.empresas?.nome)}`}>
                                                    {contrato.empresas?.nome}
                                                </span>
                                            </td>
                                            <td className="p-4 font-medium">
                                                R$ {parseFloat(contrato.valor_base_mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4">
                                                {(() => {
                                                    const { text, color, fontWeight } = getDeadlineStatus(contrato.data_inicio, contrato.duracao_meses);
                                                    return <span className={`${color} ${fontWeight}`}>{text}</span>;
                                                })()}
                                            </td>
                                            <td className="p-4 text-slate-600">
                                                Dia {contrato.dia_faturamento || '-'}
                                            </td>
                                            <td className="p-4 text-slate-600">
                                                Dia {contrato.dia_vencimento_padrao}
                                            </td>
                                            <td className="p-4">
                                                {contrato.ativo ? (
                                                    <span className="inline-flex items-center text-emerald-700 text-xs font-medium bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200"><UserCheck size={12} className="mr-1" /> Ativo</span>
                                                ) : (
                                                    <span className="inline-flex items-center text-slate-500 text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200"><UserX size={12} className="mr-1" /> Inativo</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button onClick={(e) => { e.stopPropagation(); handleOpenModal(contrato); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit size={16} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(contrato); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Edit/Create Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all scale-100 m-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gray-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    {isEditing ? 'Editar Contrato' : 'Novo Contrato'}
                                </h3>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSave} className="p-6 space-y-6">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Empresa</label>
                                        <select
                                            required
                                            value={currentContrato.empresa_id}
                                            onChange={(e) => setCurrentContrato({ ...currentContrato, empresa_id: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="">Selecione...</option>
                                            {empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Posto de Trabalho</label>
                                        <select
                                            required
                                            value={currentContrato.posto_trabalho_id}
                                            onChange={(e) => setCurrentContrato({ ...currentContrato, posto_trabalho_id: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            disabled={!currentContrato.empresa_id}
                                        >
                                            <option value="">Selecione...</option>
                                            {availablePostos.map(p => <option key={p.id} value={p.id}>{p.nome_posto}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data de Início</label>
                                        <input
                                            type="date"
                                            required
                                            value={currentContrato.data_inicio}
                                            onChange={(e) => setCurrentContrato({ ...currentContrato, data_inicio: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Duração (Meses)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={currentContrato.duracao_meses}
                                            onChange={(e) => setCurrentContrato({ ...currentContrato, duracao_meses: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            placeholder="Ex: 12"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Previsão Término</label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={calculateEndDate(currentContrato.data_inicio, currentContrato.duracao_meses)}
                                            className="w-full px-3 py-2 bg-gray-100 border border-slate-300 rounded-lg text-sm text-slate-600 cursor-not-allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Dia Faturamento</label>
                                        <input
                                            type="number"
                                            min="1" max="31"
                                            required
                                            value={currentContrato.dia_faturamento}
                                            onChange={(e) => setCurrentContrato({ ...currentContrato, dia_faturamento: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            placeholder="Ex: 20"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Valor Base Mensal (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={currentContrato.valor_base_mensal}
                                            onChange={(e) => setCurrentContrato({ ...currentContrato, valor_base_mensal: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Dia Vencimento</label>
                                        <input
                                            type="number"
                                            min="1" max="31"
                                            required
                                            value={currentContrato.dia_vencimento_padrao}
                                            onChange={(e) => setCurrentContrato({ ...currentContrato, dia_vencimento_padrao: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            placeholder="Ex: 5, 10, 15"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 my-4"></div>

                                {/* Taxes Configuration */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><DollarSign size={16} /> Configuração Tributária</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        {/* ISS (Variable) */}
                                        <div className="col-span-2">
                                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <span className="text-sm font-medium text-slate-700">Reter ISS?</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs text-slate-400">Alíq:</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={currentContrato.aliquota_iss}
                                                            onChange={(e) => setCurrentContrato({ ...currentContrato, aliquota_iss: e.target.value })}
                                                            className="w-20 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="%"
                                                        />
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer group">
                                                        <input type="checkbox" className="sr-only peer" checked={currentContrato.retem_iss} onChange={(e) => setCurrentContrato({ ...currentContrato, retem_iss: e.target.checked })} />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Fixed Rate Taxes */}
                                        {[
                                            { key: 'retem_pis', label: 'Reter PIS', rate: '0.65%' },
                                            { key: 'retem_cofins', label: 'Reter COFINS', rate: '3.00%' },
                                            { key: 'retem_csll', label: 'Reter CSLL', rate: '1.00%' },
                                            { key: 'retem_irpj', label: 'Reter IRPJ', rate: '1.50%' },
                                            { key: 'retem_inss', label: 'Reter INSS', rate: '11.00%' },
                                        ].map(tax => (
                                            <div key={tax.key} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <div>
                                                    <span className="text-sm font-medium text-slate-700 block">{tax.label}</span>
                                                    <span className="text-xs text-slate-500 font-mono">Alíquota: {tax.rate}</span>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer group">
                                                    <input type="checkbox" className="sr-only peer" checked={currentContrato[tax.key]} onChange={(e) => setCurrentContrato({ ...currentContrato, [tax.key]: e.target.checked })} />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-blue-600 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                                </label>
                                            </div>
                                        ))}

                                    </div>
                                </div>

                                <div className="border-t border-slate-100 my-4"></div>

                                {/* Caução Configuration */}
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800 mb-3">Retenção de Garantia (Caução)</h4>
                                    <div className="flex items-center justify-between bg-orange-50 p-3 rounded-lg border border-orange-100">
                                        <div>
                                            <span className="text-sm font-medium text-slate-700 block">Reter Caução?</span>
                                            {currentContrato.retem_caucao && (
                                                <span className="text-xs text-orange-600">Descontado do recebimento, mantido na base de cálculo.</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {currentContrato.retem_caucao && (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={currentContrato.aliquota_caucao}
                                                    onChange={(e) => setCurrentContrato({ ...currentContrato, aliquota_caucao: e.target.value })}
                                                    className="w-20 px-2 py-1 text-sm border border-orange-200 rounded text-orange-700 focus:ring-orange-500"
                                                    placeholder="%"
                                                />
                                            )}
                                            <label className="relative inline-flex items-center cursor-pointer group">
                                                <input type="checkbox" className="sr-only peer" checked={currentContrato.retem_caucao} onChange={(e) => setCurrentContrato({ ...currentContrato, retem_caucao: e.target.checked })} />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-300 rounded-full peer peer-checked:bg-orange-500 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>


                                <div className="border-t border-slate-100 my-4 pt-4 flex items-center justify-between">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700">Status do Contrato</label>
                                        <span className="text-xs text-slate-500">Defina se este contrato está vigente ou encerrado.</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm font-medium ${currentContrato.ativo ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {currentContrato.ativo ? 'Contrato Ativo' : 'Contrato Inativo'}
                                        </span>

                                        <label className="relative inline-flex items-center cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={currentContrato.ativo}
                                                onChange={(e) => setCurrentContrato({ ...currentContrato, ativo: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-emerald-500 transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                        </label>
                                    </div>
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
                                        <span>Salvar Contrato</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* View Modal */}
                {viewModalOpen && selectedContrato && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all scale-100 m-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gray-50">
                                <h3 className="font-bold text-slate-800">Detalhes do Contrato</h3>
                                <button onClick={handleCloseViewModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Empresa</label>
                                        <div className="text-sm text-slate-900">{selectedContrato.empresas?.nome}</div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                                        {selectedContrato.ativo ? (
                                            <span className="inline-flex items-center text-emerald-700 text-xs font-medium bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200"><UserCheck size={12} className="mr-1" /> Ativo</span>
                                        ) : (
                                            <span className="inline-flex items-center text-slate-500 text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200"><UserX size={12} className="mr-1" /> Inativo</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Posto de Trabalho</label>
                                    <div className="text-sm text-slate-900">{selectedContrato.postos_trabalho?.nome_posto}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Valor Base</label>
                                        <div className="text-lg font-bold text-slate-800">R$ {parseFloat(selectedContrato.valor_base_mensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Vencimento</label>
                                        <div className="text-sm text-slate-900">Dia {selectedContrato.dia_vencimento_padrao}</div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 border-b border-slate-100 pb-1">Tributação</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex justify-between"><span>ISS:</span> <span className="font-mono">{selectedContrato.retem_iss ? `${selectedContrato.aliquota_iss}%` : 'Não'}</span></div>
                                        <div className="flex justify-between"><span>PIS:</span> <span className="font-mono">{selectedContrato.retem_pis ? 'Sim' : 'Não'}</span></div>
                                        <div className="flex justify-between"><span>COFINS:</span> <span className="font-mono">{selectedContrato.retem_cofins ? 'Sim' : 'Não'}</span></div>
                                        <div className="flex justify-between"><span>CSLL:</span> <span className="font-mono">{selectedContrato.retem_csll ? 'Sim' : 'Não'}</span></div>
                                        <div className="flex justify-between"><span>IRPJ:</span> <span className="font-mono">{selectedContrato.retem_irpj ? 'Sim' : 'Não'}</span></div>
                                        <div className="flex justify-between"><span>INSS:</span> <span className="font-mono">{selectedContrato.retem_inss ? 'Sim' : 'Não'}</span></div>
                                        <div className="flex justify-between text-orange-600 font-semibold"><span>Caução:</span> <span className="font-mono">{selectedContrato.retem_caucao ? `${selectedContrato.aliquota_caucao}%` : 'Não'}</span></div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-gray-50 flex justify-end">
                                <button onClick={handleCloseViewModal} className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Fechar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal reused from PostosTrabalho logic */}
                {deleteModalOpen && contratoToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="text-red-600" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Excluir Contrato</h3>
                                <p className="text-slate-600 text-sm mb-6">
                                    Tem certeza? Isso pode afetar faturamentos futuros.
                                </p>
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <button onClick={() => setDeleteModalOpen(false)} className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-medium text-sm">Cancelar</button>
                                    <button onClick={confirmDelete} className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-lg text-sm">Sim, Excluir</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feedback Modal (Success/Error) */}
                {feedbackModal.open && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                            <div className="p-6 text-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${feedbackModal.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                    {feedbackModal.type === 'success' ? (
                                        <CheckCircle className="text-emerald-600" size={32} />
                                    ) : (
                                        <AlertCircle className="text-red-600" size={32} />
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">{feedbackModal.title}</h3>
                                <p className="text-slate-600 text-sm mb-6">
                                    {feedbackModal.message}
                                </p>
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

                {/* Success Modal (Dedicated) */}
                {successModal.open && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="text-emerald-600" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Sucesso!</h3>
                                <p className="text-slate-600 text-sm mb-6">
                                    {successModal.message}
                                </p>
                                <button
                                    onClick={() => setSuccessModal({ open: false, message: '' })}
                                    className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-lg shadow-emerald-500/30 transition-all text-sm block"
                                >
                                    OK, Entendido
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Contratos;
