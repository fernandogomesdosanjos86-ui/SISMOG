import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Search, DollarSign, CheckCircle, Clock, Edit, Trash2, X, Calculator, Save, AlertCircle, FileText, Calendar, RotateCcw, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Recebimentos = () => {
    const [recebimentos, setRecebimentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEmpresa, setFilterEmpresa] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecebimento, setCurrentRecebimento] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Modais de Feedback e Confirmação
    const [feedbackModal, setFeedbackModal] = useState({ open: false, type: 'success', title: '', message: '' });
    const [confirmRecebimentoModal, setConfirmRecebimentoModal] = useState({ open: false, id: null });
    const [undoModalOpen, setUndoModalOpen] = useState({ open: false, id: null });

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    const getEmpresaStripColor = (nomeEmpresa) => {
        const nome = (nomeEmpresa || '').toLowerCase();
        if (nome.includes('femog')) return '#2563eb';
        if (nome.includes('semog')) return '#f97316';
        return '#9ca3af';
    };

    useEffect(() => {
        fetchRecebimentos();
    }, [selectedDate]);

    const fetchRecebimentos = async () => {
        try {
            setLoading(true);
            const [year, month] = selectedDate.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(year, month, 0).toISOString().slice(0, 10);

            const { data, error } = await supabase
                .from('recebimentos')
                .select(`
                    *,
                    empresas (nome),
                    faturamentos (
                        contratos (
                            postos_trabalho (nome_posto)
                        )
                    )
                `)
                .gte('data_vencimento', startDate) // Filter by Due Date in this month
                .lte('data_vencimento', endDate)
                .order('data_vencimento', { ascending: true });

            if (error) throw error;
            setRecebimentos(data || []);
        } catch (error) {
            console.error('Erro ao buscar recebimentos:', error);
        } finally {
            setLoading(false);
        }
    };

    // 1. Apenas abre o modal (Substitui o window.confirm)
    const handleMarkAsReceivedClick = (id) => {
        setConfirmRecebimentoModal({ open: true, id });
    };

    // 2. Executa a lógica real (chamada pelo botão "Sim" do modal)
    const executeMarkAsReceived = async () => {
        const id = confirmRecebimentoModal.id;
        if (!id) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('recebimentos')
                .update({
                    status: 'Recebido',
                    data_recebimento: new Date().toISOString().split('T')[0]
                })
                .eq('id', id);

            if (error) throw error;

            await fetchRecebimentos();
            setIsModalOpen(false); // Fecha o modal de edição se estiver aberto
            setConfirmRecebimentoModal({ open: false, id: null }); // Fecha modal de confirmação

            setFeedbackModal({
                open: true,
                type: 'success',
                title: 'Sucesso!',
                message: 'Recebimento confirmado e baixado com sucesso.'
            });

        } catch (error) {
            setFeedbackModal({
                open: true,
                type: 'error',
                title: 'Erro!',
                message: 'Erro ao baixar recebimento: ' + error.message
            });
        } finally {
            setLoading(false);
        }
    };

    // Abre o modal de confirmação
    const handleUndoClick = (id) => {
        setUndoModalOpen({ open: true, id });
    };

    // Executa o estorno no banco
    const executeUndoReceipt = async () => {
        const id = undoModalOpen.id;
        if (!id) return;

        try {
            setLoading(true);
            // Reverte status para Pendente e limpa a data de recebimento
            const { error } = await supabase
                .from('recebimentos')
                .update({
                    status: 'Pendente',
                    data_recebimento: null
                })
                .eq('id', id);

            if (error) throw error;

            await fetchRecebimentos();
            setUndoModalOpen({ open: false, id: null });

            setFeedbackModal({
                open: true,
                type: 'success',
                title: 'Estorno Realizado!',
                message: 'O status do recebimento foi revertido para Pendente.'
            });

        } catch (error) {
            setFeedbackModal({
                open: true,
                type: 'error',
                title: 'Erro no Estorno',
                message: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e?.preventDefault();
        try {
            const { error } = await supabase
                .from('recebimentos')
                .update({
                    valor: currentRecebimento.valor,
                    data_vencimento: currentRecebimento.data_vencimento,
                    status: currentRecebimento.status
                })
                .eq('id', currentRecebimento.id);

            if (error) throw error;
            fetchRecebimentos();
            setIsModalOpen(false);
            setFeedbackModal({ open: true, type: 'success', title: 'Atualizado!', message: 'Recebimento salvo com sucesso.' });
        } catch (error) {
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        }
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const { error } = await supabase
                .from('recebimentos')
                .delete()
                .eq('id', itemToDelete.id);

            if (error) throw error;
            fetchRecebimentos();
            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: 'Erro ao excluir: ' + error.message });
        }
    };

    const handleRowClick = (item) => {
        setCurrentRecebimento(item);
        setIsModalOpen(true);
    };

    // 1. Filtragem Base (Busca e Empresa) - Alimenta os Cards de Estatística
    const itemsForStats = recebimentos.filter(r => {
        const postoName = r.faturamentos?.contratos?.postos_trabalho?.nome_posto || '';
        const empresaName = r.empresas?.nome || '';

        const matchesSearch =
            postoName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            empresaName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesEmpresa = filterEmpresa ?
            empresaName.toLowerCase().includes(filterEmpresa.toLowerCase()) : true;

        return matchesSearch && matchesEmpresa;
    });

    // 2. Filtragem Final (Status) - Alimenta a Tabela
    const filteredItems = itemsForStats.filter(r => {
        const matchesStatus = filterStatus ? r.status === filterStatus : true;
        return matchesStatus;
    });

    // 3. Cálculo de Estatísticas (Baseado na primeira camada de filtro)
    const stats = useMemo(() => {
        // Usa itemsForStats para que o filtro de status não altere os totais dos cards
        const total = itemsForStats.reduce((acc, curr) => acc + parseFloat(curr.valor), 0);

        const received = itemsForStats
            .filter(i => i.status === 'Recebido')
            .reduce((acc, curr) => acc + parseFloat(curr.valor), 0);

        const pending = total - received;

        return { total, received, pending };
    }, [itemsForStats]);

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="ml-0 md:ml-72 transition-all duration-300 flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden text-slate-900">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <DollarSign className="text-emerald-600" /> Gestão de Recebimentos
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Acompanhamento de entradas e fluxo de caixa
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500">Vencimento:</span>
                            <input
                                type="month"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Card 1: Total Previsto */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Previsto</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">
                                    {stats.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </h3>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <DollarSign className="text-blue-600" size={24} />
                            </div>
                        </div>

                        {/* Card 2: Pendente */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Pendente</p>
                                <h3 className="text-2xl font-bold text-red-600 mt-1">
                                    {stats.pending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </h3>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg">
                                <Clock className="text-orange-600" size={24} />
                            </div>
                        </div>

                        {/* Card 3: Recebido */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Recebido</p>
                                <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                                    {stats.received.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </h3>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-lg">
                                <CheckCircle className="text-emerald-600" size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 shadow-sm">
                        <div className="relative w-full md:w-[40%]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por cliente ou posto..."
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
                                style={{ height: '48px', minWidth: '150px' }}
                            >
                                <option value="">Todas Empresas</option>
                                <option value="femog">Femog</option>
                                <option value="semog">Semog</option>
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                style={{ height: '48px', minWidth: '150px' }}
                            >
                                <option value="">Todos Status</option>
                                <option value="Pendente">Pendente</option>
                                <option value="Recebido">Recebido</option>
                            </select>
                        </div>
                    </div>

                    {/* List */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                        {/* VIEW MOBILE: CARDS */}
                        <div className="block md:hidden divide-y divide-slate-100">
                            {filteredItems.map((item) => (
                                <div key={item.id} className="relative p-4 flex flex-col gap-3 bg-white">
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#10b981' }}></div> {/* Faixa Verde */}
                                    <div className="pl-3 flex justify-between items-start">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-800">{item.faturamentos?.contratos?.postos_trabalho?.nome_posto || 'Posto Indefinido'}</h4>
                                            <p className="text-xs text-slate-500 mt-0.5">{item.empresas?.nome || 'N/A'}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase border ${item.status === 'Recebido' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                            {item.status === 'Recebido' ? 'PAGO' : 'PENDENTE'}
                                        </span>
                                    </div>
                                    <div className="pl-3 mt-3 flex justify-between items-center">
                                        <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                                            {item.data_vencimento ? new Date(item.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                                        </span>
                                        <span className="text-lg font-bold text-emerald-600">
                                            {formatCurrency(item.valor)}
                                        </span>
                                    </div>
                                    {/* Botões de Ação na parte inferior direita */}
                                    <div className="pl-3 mt-3 pt-3 border-t border-slate-100 flex justify-end gap-2">
                                        {item.status === 'Recebido' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleUndoClick(item.id); }}
                                                className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                                            >
                                                <RotateCcw size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}
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
                            ))}
                        </div>

                        {/* VIEW DESKTOP: TABLE */}
                        <div className="hidden md:block overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-semibold pl-6">Vencimento</th>
                                        <th className="p-4 font-semibold">Cliente / Posto</th>
                                        <th className="p-4 font-semibold">Empresa</th>
                                        <th className="p-4 font-semibold">Valor</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredItems.length === 0 ? (
                                        <tr><td colSpan="6" className="p-8 text-center text-slate-500">Nenhum recebimento encontrado.</td></tr>
                                    ) : filteredItems.map((item) => (
                                        <tr
                                            key={item.id}
                                            onClick={() => handleRowClick(item)}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                        >
                                            <td className="relative p-0">
                                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getEmpresaStripColor(item.empresas?.nome) }}></div>
                                                <div className="py-4 pr-4 pl-6 font-medium text-slate-700">
                                                    {item.data_vencimento ? new Date(item.data_vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-normal text-slate-900">
                                                    {item.faturamentos?.contratos?.postos_trabalho?.nome_posto || 'Posto Indefinido'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${(item.empresas?.nome || '').toLowerCase().includes('semog')
                                                    ? 'bg-orange-50 text-orange-700 border-orange-100'
                                                    : (item.empresas?.nome || '').toLowerCase().includes('femog')
                                                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                        : 'bg-gray-50 text-slate-700 border-gray-100'
                                                    }`}>
                                                    {item.empresas?.nome || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-slate-900">{formatCurrency(item.valor)}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${item.status === 'Recebido' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                                                    {item.status === 'Recebido' ? <CheckCircle size={12} className="mr-1" /> : <Clock size={12} className="mr-1" />}
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    {/* Botão Desfazer (Novo) - Apenas se já estiver recebido */}
                                                    {item.status === 'Recebido' && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleUndoClick(item.id); }}
                                                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Desfazer Recebimento (Estornar)"
                                                        >
                                                            <RotateCcw size={16} />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleRowClick(item); }}
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

                {/* Visualização Modal (Read-Only) */}
                {isModalOpen && currentRecebimento && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100">
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gray-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <FileText size={18} className="text-blue-600" />
                                    Detalhes do Recebimento # {currentRecebimento.id}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
                            </div>

                            <div className="p-6">
                                <div className="space-y-4 mb-6">
                                    {/* Data Vencimento - Bloqueado */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data de Vencimento</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Calendar size={16} /></div>
                                            <input
                                                type="date"
                                                disabled
                                                readOnly
                                                value={currentRecebimento.data_vencimento || ''}
                                                className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    {/* Valor - Bloqueado */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Valor (R$)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><DollarSign size={16} /></div>
                                            <input
                                                type="number"
                                                disabled
                                                readOnly
                                                value={currentRecebimento.valor}
                                                className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-slate-200 rounded-lg text-lg font-bold text-slate-500 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    {/* Status - Bloqueado */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                                        <div className="w-full px-3 py-3 bg-gray-50 border border-slate-200 rounded-lg text-slate-500 font-medium flex items-center gap-2">
                                            {currentRecebimento.status === 'Recebido' ? <CheckCircle size={16} className="text-emerald-500" /> : <Clock size={16} className="text-orange-500" />}
                                            {currentRecebimento.status}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-full px-4 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                    >
                                        Fechar Visualização
                                    </button>
                                </div>

                                {currentRecebimento.status === 'Pendente' && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <button
                                            type="button"
                                            onClick={() => handleMarkAsReceivedClick(currentRecebimento.id)}
                                            className="w-full px-4 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                                        >
                                            <CheckCircle size={18} /> CONFIRMAR RECEBIMENTO AGORA
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Modal */}
                {deleteModalOpen && itemToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="text-red-600" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Confirmar Exclusão</h3>
                                <p className="text-slate-600 text-sm mb-6">
                                    Tem certeza que deseja excluir o recebimento de valor <strong>{formatCurrency(itemToDelete.valor)}</strong>?
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
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Confirmação de Recebimento */}
                {confirmRecebimentoModal.open && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="text-emerald-600" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Confirmar Baixa</h3>
                                <p className="text-slate-600 text-sm mb-6">
                                    Deseja confirmar o recebimento deste valor? <br />
                                    A data de recebimento será registrada como hoje.
                                </p>
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <button
                                        onClick={() => setConfirmRecebimentoModal({ open: false, id: null })}
                                        className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={executeMarkAsReceived}
                                        className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-lg shadow-emerald-500/30 transition-all text-sm block"
                                    >
                                        Sim, Confirmar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Genérico de Feedback (Sucesso/Erro) */}
                {feedbackModal.open && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                            <div className="p-6 text-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${feedbackModal.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'
                                    }`}>
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
                                    className={`w-full px-4 py-3 rounded-lg font-medium shadow-lg transition-all text-sm block text-white ${feedbackModal.type === 'success'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'
                                        : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                                        }`}
                                >
                                    Entendido
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal de Confirmação de Estorno (Laranja) */}
                {undoModalOpen.open && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="text-orange-600" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Estornar Recebimento?</h3>
                                <p className="text-slate-600 text-sm mb-6">
                                    Esta ação reverterá o status para <strong>Pendente</strong> e removerá a data de pagamento.<br />
                                    O valor voltará a constar como "A Receber".
                                </p>
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <button
                                        onClick={() => setUndoModalOpen({ open: false, id: null })}
                                        className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={executeUndoReceipt}
                                        className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium shadow-lg shadow-orange-500/30 transition-all text-sm block"
                                    >
                                        Sim, Estornar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Recebimentos;
