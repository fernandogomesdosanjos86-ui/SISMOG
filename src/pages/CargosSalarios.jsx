import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Search, Edit, Trash2, Building2, X, Save, Briefcase, FileText, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const CargosSalarios = () => {
    const [cargos, setCargos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State - Edit/Create
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCargo, setCurrentCargo] = useState({
        empresa_id: '',
        cargo: '',
        uf: '',
        salario_base: '',
        adicional_noturno_pct: '',
        periculosidade_pct: '',
        intrajornada_pct: '',
        valor_alimentacao: '',
        desconto_alimentacao: '',
        extra_diurno: '',
        extra_noturno: ''
    });
    const [isEditing, setIsEditing] = useState(false);

    // View Modal State
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedCargo, setSelectedCargo] = useState(null);

    // Novos estados para Modais
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [feedbackModal, setFeedbackModal] = useState({ open: false, type: 'success', title: '', message: '' });

    // Helper de Cor (Identidade Visual)
    const getEmpresaStripColor = (nomeEmpresa) => {
        const nome = (nomeEmpresa || '').toLowerCase();
        if (nome.includes('femog')) return '#2563eb';
        if (nome.includes('semog')) return '#f97316';
        return '#9ca3af';
    };

    useEffect(() => {
        fetchCargos();
        fetchEmpresas();
    }, []);

    const fetchCargos = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('cargos_salarios')
                .select('*, empresas(nome)')
                .order('cargo', { ascending: true });

            if (error) throw error;
            setCargos(data || []);
        } catch (error) {
            console.error('Erro ao buscar cargos:', error.message);
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

    // Formatters
    const formatCurrency = (value) => {
        if (!value) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatPercent = (value) => {
        if (!value) return '0,00%';
        return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + '%';
    };

    // Input Masks
    const maskCurrency = (value) => {
        value = value.replace(/\D/g, "");
        value = (Number(value) / 100).toFixed(2) + "";
        value = value.replace(".", ",");
        value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
        return "R$ " + value;
    };

    const maskPercent = (value) => {
        value = value.replace(/\D/g, "");
        value = (Number(value) / 100).toFixed(2) + "";
        value = value.replace(".", ",");
        return value + "%";
    };

    const parseCurrency = (str) => {
        if (!str) return 0;
        return parseFloat(str.replace("R$ ", "").replace(/\./g, "").replace(",", "."));
    };

    const parsePercent = (str) => {
        if (!str) return 0;
        return parseFloat(str.replace("%", "").replace(",", "."));
    };

    const handleInputChange = (field, value, type) => {
        let newValue = value;
        if (type === 'currency') {
            newValue = maskCurrency(value);
        } else if (type === 'percent') {
            newValue = maskPercent(value);
        }
        setCurrentCargo({ ...currentCargo, [field]: newValue });
    };

    const handleRowClick = (cargo) => {
        setSelectedCargo(cargo);
        setViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setViewModalOpen(false);
        setSelectedCargo(null);
    };

    const handleOpenModal = (cargo = null) => {
        if (cargo) {
            setCurrentCargo({
                id: cargo.id,
                empresa_id: cargo.empresa_id,
                cargo: cargo.cargo,
                uf: cargo.uf,
                salario_base: maskCurrency(cargo.salario_base.toFixed(2)),
                adicional_noturno_pct: maskPercent(cargo.adicional_noturno_pct.toFixed(2)),
                periculosidade_pct: maskPercent(cargo.periculosidade_pct.toFixed(2)),
                intrajornada_pct: maskPercent(cargo.intrajornada_pct.toFixed(2)),
                valor_alimentacao: maskCurrency(cargo.valor_alimentacao.toFixed(2)),
                desconto_alimentacao: maskCurrency(cargo.desconto_alimentacao.toFixed(2)),
                extra_diurno: maskCurrency((cargo.extra_diurno || 0).toFixed(2)),
                extra_noturno: maskCurrency((cargo.extra_noturno || 0).toFixed(2))
            });
            setIsEditing(true);
        } else {
            setCurrentCargo({
                empresa_id: '',
                cargo: '',
                uf: '',
                salario_base: '',
                adicional_noturno_pct: '',
                periculosidade_pct: '',
                intrajornada_pct: '',
                valor_alimentacao: '',
                desconto_alimentacao: '',
                extra_diurno: '',
                extra_noturno: ''
            });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentCargo({
            empresa_id: '',
            cargo: '',
            uf: '',
            salario_base: '',
            adicional_noturno_pct: '',
            periculosidade_pct: '',
            intrajornada_pct: '',
            valor_alimentacao: '',
            desconto_alimentacao: '',
            extra_diurno: '',
            extra_noturno: ''
        });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                empresa_id: currentCargo.empresa_id,
                cargo: currentCargo.cargo,
                uf: currentCargo.uf,
                salario_base: parseCurrency(currentCargo.salario_base),
                adicional_noturno_pct: parsePercent(currentCargo.adicional_noturno_pct),
                periculosidade_pct: parsePercent(currentCargo.periculosidade_pct),
                intrajornada_pct: parsePercent(currentCargo.intrajornada_pct),
                valor_alimentacao: parseCurrency(currentCargo.valor_alimentacao),
                desconto_alimentacao: parseCurrency(currentCargo.desconto_alimentacao),
                extra_diurno: parseCurrency(currentCargo.extra_diurno),
                extra_noturno: parseCurrency(currentCargo.extra_noturno)
            };

            if (isEditing) {
                const { error } = await supabase
                    .from('cargos_salarios')
                    .update(payload)
                    .eq('id', currentCargo.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('cargos_salarios')
                    .insert([payload]);
                if (error) throw error;
            }
            fetchCargos();
            handleCloseModal();
            setFeedbackModal({
                open: true,
                type: 'success',
                title: isEditing ? 'Atualizado!' : 'Cadastrado!',
                message: isEditing ? 'Cargo atualizado com sucesso.' : 'Novo cargo criado com sucesso.'
            });
        } catch (error) {
            console.error('Erro ao salvar cargo:', error.message);
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
            const { error } = await supabase.from('cargos_salarios').delete().eq('id', itemToDelete.id);
            if (error) throw error;
            fetchCargos();
            setDeleteModalOpen(false);
            setItemToDelete(null);
            setFeedbackModal({ open: true, type: 'success', title: 'Excluído!', message: 'Cargo removido com sucesso.' });
        } catch (error) {
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        }
    };

    const filteredCargos = cargos.filter(c =>
        c.cargo?.toLowerCase().includes(searchTerm.toLowerCase())
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
                                <Briefcase className="text-blue-600" /> Gestão de Cargos e Salários
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Gerencie os cargos, salários e benefícios
                            </p>
                        </div>

                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/20 font-medium text-sm"
                        >
                            <Plus size={18} />
                            <span>Novo Cargo</span>
                        </button>
                    </div>

                    {/* Filters & Search */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center space-x-4 shadow-sm">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por nome do cargo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-300 text-slate-900 pl-10 pr-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 text-sm"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                        {/* VIEW MOBILE: CARDS */}
                        <div className="block md:hidden space-y-3 p-3 bg-slate-50">
                            {filteredCargos.map((cargo) => (
                                <div key={cargo.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getEmpresaStripColor(cargo.empresas?.nome) }}></div>
                                    <div className="pl-3 flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-slate-800">{cargo.cargo}</h4>
                                            <span className="text-xs text-slate-500 uppercase font-mono">{cargo.uf || 'BR'}</span>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded border ${(cargo.empresas?.nome || '').toLowerCase().includes('semog') ? 'bg-orange-50 text-orange-700 border-orange-100' : (cargo.empresas?.nome || '').toLowerCase().includes('femog') ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-slate-700 border-gray-100'}`}>
                                            {cargo.empresas?.nome}
                                        </span>
                                    </div>
                                    <div className="pl-3 mt-3 flex justify-between items-end border-t border-slate-50 pt-2">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase">Salário Base</p>
                                            <p className="text-lg font-bold text-slate-800">{formatCurrency(cargo.salario_base)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); handleOpenModal(cargo); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={16} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(cargo); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
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
                                        <th className="p-4 font-semibold pl-6">Cargo / UF</th>
                                        <th className="p-4 font-semibold">Empresa</th>
                                        <th className="p-4 font-semibold">Salário Base</th>
                                        <th className="p-4 font-semibold">Extras (D/N)</th>
                                        <th className="p-4 font-semibold text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr><td colSpan="4" className="p-8 text-center">Carregando...</td></tr>
                                    ) : filteredCargos.length === 0 ? (
                                        <tr><td colSpan="4" className="p-8 text-center text-slate-500">Nenhum cargo encontrado.</td></tr>
                                    ) : (
                                        filteredCargos.map((cargo) => (
                                            <tr
                                                key={cargo.id}
                                                onClick={() => handleRowClick(cargo)}
                                                className="hover:bg-gray-50 transition-colors group cursor-pointer relative"
                                            >
                                                <td className="relative p-0">
                                                    {/* Faixa Vertical */}
                                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getEmpresaStripColor(cargo.empresas?.nome) }}></div>

                                                    {/* Conteúdo Unificado: Cargo - UF */}
                                                    <div className="py-4 pr-4 pl-6 font-normal text-slate-900">
                                                        {cargo.cargo} - {cargo.uf || 'BR'}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${(cargo.empresas?.nome || '').toLowerCase().includes('semog') ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                        (cargo.empresas?.nome || '').toLowerCase().includes('femog') ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                            'bg-gray-50 text-slate-700 border-gray-100'
                                                        }`}>
                                                        {cargo.empresas?.nome}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-medium text-slate-700">
                                                    {formatCurrency(cargo.salario_base)}
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-xs text-slate-500">D: <span className="text-slate-700 font-medium">{formatCurrency(cargo.extra_diurno || 0)}</span></div>
                                                    <div className="text-xs text-slate-500">N: <span className="text-slate-700 font-medium">{formatCurrency(cargo.extra_noturno || 0)}</span></div>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button onClick={(e) => { e.stopPropagation(); handleOpenModal(cargo); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                                            <Edit size={16} />
                                                        </button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(cargo); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
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

            {/* View Modal */}
            {viewModalOpen && selectedCargo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gray-50">
                            <h3 className="font-bold text-slate-800">Detalhes do Cargo</h3>
                            <button onClick={handleCloseViewModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Empresa</label>
                                <div className="text-sm text-slate-900">{selectedCargo.empresas?.nome}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cargo</label>
                                <div className="text-sm text-slate-900">{selectedCargo.cargo}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">UF</label>
                                <div className="text-sm text-slate-900">{selectedCargo.uf}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Salário Base</label>
                                <div className="text-sm font-medium text-slate-900">{formatCurrency(selectedCargo.salario_base)}</div>
                            </div>

                            <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Adicionais e Benefícios</h4>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Periculosidade</label>
                                <div className="text-sm text-slate-900">{formatPercent(selectedCargo.periculosidade_pct)}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Adicional Noturno</label>
                                <div className="text-sm text-slate-900">{formatPercent(selectedCargo.adicional_noturno_pct)}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Intrajornada</label>
                                <div className="text-sm text-slate-900">{formatPercent(selectedCargo.intrajornada_pct)}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">VR / VA</label>
                                <div className="text-sm text-slate-900">{formatCurrency(selectedCargo.valor_alimentacao)} (Desconto: {formatCurrency(selectedCargo.desconto_alimentacao)})</div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Extra Diurno</label>
                                <div className="text-sm text-slate-900">{formatCurrency(selectedCargo.extra_diurno)}</div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Extra Noturno</label>
                                <div className="text-sm text-slate-900">{formatCurrency(selectedCargo.extra_noturno)}</div>
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

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 h-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gray-50 sticky top-0 z-10">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                {isEditing ? 'Editar Cargo' : 'Novo Cargo'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Empresa</label>
                                    <select
                                        required
                                        value={currentCargo.empresa_id}
                                        onChange={(e) => setCurrentCargo({ ...currentCargo, empresa_id: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                    >
                                        <option value="">Selecione uma empresa</option>
                                        {empresas.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Cargo</label>
                                    <input
                                        type="text"
                                        required
                                        value={currentCargo.cargo}
                                        onChange={(e) => setCurrentCargo({ ...currentCargo, cargo: e.target.value })}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        placeholder="Ex: Motorista"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">UF</label>
                                    <input
                                        type="text"
                                        maxLength={2}
                                        value={currentCargo.uf}
                                        onChange={(e) => setCurrentCargo({ ...currentCargo, uf: e.target.value.toUpperCase() })}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        placeholder="Ex: SP"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Salário Base</label>
                                    <input
                                        type="text"
                                        value={currentCargo.salario_base}
                                        onChange={(e) => handleInputChange('salario_base', e.target.value, 'currency')}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        placeholder="R$ 0,00"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Percentuais e Adicionais</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Periculosidade</label>
                                        <input
                                            type="text"
                                            value={currentCargo.periculosidade_pct}
                                            onChange={(e) => handleInputChange('periculosidade_pct', e.target.value, 'percent')}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            placeholder="0,00%"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Adic. Noturno</label>
                                        <input
                                            type="text"
                                            value={currentCargo.adicional_noturno_pct}
                                            onChange={(e) => handleInputChange('adicional_noturno_pct', e.target.value, 'percent')}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            placeholder="0,00%"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Intrajornada</label>
                                        <input
                                            type="text"
                                            value={currentCargo.intrajornada_pct}
                                            onChange={(e) => handleInputChange('intrajornada_pct', e.target.value, 'percent')}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            placeholder="0,00%"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Horas Extras (Valor Fixo)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Extra Diurno (R$)</label>
                                        <input
                                            type="text"
                                            value={currentCargo.extra_diurno}
                                            onChange={(e) => handleInputChange('extra_diurno', e.target.value, 'currency')}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            placeholder="R$ 0,00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Extra Noturno (R$)</label>
                                        <input
                                            type="text"
                                            value={currentCargo.extra_noturno}
                                            onChange={(e) => handleInputChange('extra_noturno', e.target.value, 'currency')}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            placeholder="R$ 0,00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Alimentação</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Valor Alimentação</label>
                                        <input
                                            type="text"
                                            value={currentCargo.valor_alimentacao}
                                            onChange={(e) => handleInputChange('valor_alimentacao', e.target.value, 'currency')}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            placeholder="R$ 0,00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Desconto Alimentação</label>
                                        <input
                                            type="text"
                                            value={currentCargo.desconto_alimentacao}
                                            onChange={(e) => handleInputChange('desconto_alimentacao', e.target.value, 'currency')}
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            placeholder="R$ 0,00"
                                        />
                                    </div>
                                </div>
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
                    </div>
                </div>
            )}
            {/* Delete Modal */}
            {deleteModalOpen && itemToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="text-red-600" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Excluir Cargo?</h3>
                            <p className="text-slate-600 text-sm mb-6">
                                Tem certeza que deseja excluir <strong>{itemToDelete.cargo}</strong>?<br />
                                Essa ação não pode ser desfeita.
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                        <div className="p-6 text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${feedbackModal.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                {feedbackModal.type === 'success' ? <CheckCircle className="text-emerald-600" size={32} /> : <AlertCircle className="text-red-600" size={32} />}
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">{feedbackModal.title}</h3>
                            <p className="text-slate-600 text-sm mb-6">{feedbackModal.message}</p>
                            <button onClick={() => setFeedbackModal({ ...feedbackModal, open: false })} className={`w-full px-4 py-3 rounded-lg font-medium shadow-lg transition-all text-sm block text-white ${feedbackModal.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'}`}>Entendido</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CargosSalarios;
