import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Calculator, Calendar, DollarSign, CheckCircle, AlertCircle, X, Save, Plus, Edit, Trash2, Clock, RotateCcw, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Faturamentos = () => {
    const [faturamentos, setFaturamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingGen, setLoadingGen] = useState(false);

    // Filters
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [filterEmpresa, setFilterEmpresa] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('EDIT'); // 'EDIT' or 'VIEW'
    const [currentFaturamento, setCurrentFaturamento] = useState(null);
    const [calculatedValues, setCalculatedValues] = useState(null);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // New Modals State
    const [confirmFaturarModal, setConfirmFaturarModal] = useState({ open: false, id: null });
    const [undoModalOpen, setUndoModalOpen] = useState({ open: false, id: null });
    const [feedbackModal, setFeedbackModal] = useState({ open: false, type: 'success', title: '', message: '' });
    const [isNextMonth, setIsNextMonth] = useState(false);

    // Helpers
    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    const parseCurrency = (val) => parseFloat(val || 0);

    useEffect(() => {
        fetchFaturamentos();
    }, [selectedDate]); // Refetch when month changes

    const fetchFaturamentos = async () => {
        try {
            setLoading(true);
            // Construct start/end dates for the selected month to filter
            const [year, month] = selectedDate.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(year, month, 0).toISOString().slice(0, 10); // Last day of month

            const { data, error } = await supabase
                .from('faturamentos')
                .select(`
                    *,
                    contratos (
                        *,
                        empresas (nome),
                        postos_trabalho (nome_posto)
                    )
                `)
                .eq('mes_competencia', startDate)
                .order('data_emissao', { ascending: true });

            if (error) throw error;
            setFaturamentos(data || []);
        } catch (error) {
            console.error('Erro ao buscar faturamentos:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCompetencia = async () => {
        try {
            setLoadingGen(true);
            const [year, month] = selectedDate.split('-');
            const mesCompetencia = `${year}-${month}-01`;

            // 1. Fetch Active Contracts
            const { data: contratos, error: errCont } = await supabase
                .from('contratos')
                .select('*')
                .eq('ativo', true);

            if (errCont) throw errCont;

            if (!contratos.length) {
                setFeedbackModal({ open: true, type: 'error', title: 'Atenção', message: 'Nenhum contrato ativo encontrado.' });
                return;
            }

            // 2. Iterate and Check Existence (Idempotent)
            const newBillings = [];

            // Fetch all existing billings for this month in one go to optimize
            const { data: existing, error: errExist } = await supabase
                .from('faturamentos')
                .select('contrato_id')
                .eq('mes_competencia', mesCompetencia);

            if (errExist) throw errExist;
            const existingIds = new Set(existing.map(f => f.contrato_id));

            // Check individually (logic requested by user, but bulk check is equivalent and faster. We keep the bulk filter but ensure logic is solid)
            const contractsToBill = contratos.filter(c => !existingIds.has(c.id));

            if (contractsToBill.length === 0) {
                setFeedbackModal({ open: true, type: 'success', title: 'Tudo pronto!', message: 'Todos os contratos ativos já possuem faturamento para este mês.' });
                return;
            }

            // Prepare payloads
            contractsToBill.forEach(c => {
                // Validity Check
                if (c.data_inicio && c.duracao_meses) {
                    const startDate = new Date(c.data_inicio + 'T12:00:00'); // Safe parsing YYYY-MM-DD
                    const endDate = new Date(startDate);
                    endDate.setMonth(endDate.getMonth() + c.duracao_meses);
                    endDate.setDate(endDate.getDate() - 1);

                    const [y, m] = selectedDate.split('-');
                    const monthStart = new Date(y, m - 1, 1, 12, 0, 0);
                    const monthEnd = new Date(y, m, 0, 12, 0, 0);

                    // If month is completely outside validity period
                    if (monthEnd < startDate || monthStart > endDate) {
                        return; // Skip this contract
                    }
                }

                // Billing Day Logic
                let emissionDate = new Date().toISOString().slice(0, 10);
                if (c.dia_faturamento) {
                    const [y, m] = selectedDate.split('-');
                    const lastDay = new Date(y, m, 0).getDate();
                    const day = Math.min(c.dia_faturamento, lastDay);
                    emissionDate = `${y}-${m}-${String(day).padStart(2, '0')}`;
                }

                newBillings.push({
                    contrato_id: c.id,
                    mes_competencia: mesCompetencia,
                    valor_bruto: c.valor_base_mensal,
                    status: 'Pendente',
                    data_emissao: emissionDate,
                    ...calculateTaxValues(c.valor_base_mensal, c)
                });
            });

            // 4. Insert
            const { error: errIns } = await supabase.from('faturamentos').insert(newBillings);
            if (errIns) throw errIns;

            fetchFaturamentos();
            setFeedbackModal({ open: true, type: 'success', title: 'Gerado com Sucesso!', message: `${newBillings.length} faturamentos gerados com sucesso!` });

        } catch (error) {
            console.error('Erro ao gerar competência:', error);
            setFeedbackModal({ open: true, type: 'error', title: 'Erro', message: 'Erro: ' + error.message });
        } finally {
            setLoadingGen(false);
        }
    };

    // The TAX ENGINE
    const calculateTaxValues = (brutoVal, contrato) => {
        const bruto = parseFloat(brutoVal || 0);

        // Safety check helper
        const safeRate = (rate) => parseFloat(rate || 0);

        let taxes = {
            val_iss: 0, val_pis: 0, val_cofins: 0, val_csll: 0, val_irpj: 0, val_inss: 0, val_caucao: 0
        };

        // Always calculate ISS for reference
        taxes.val_iss = bruto * (safeRate(contrato.aliquota_iss) / 100);

        if (contrato?.retem_pis) taxes.val_pis = bruto * 0.0065;
        if (contrato?.retem_cofins) taxes.val_cofins = bruto * 0.0300;
        if (contrato?.retem_csll) taxes.val_csll = bruto * 0.0100;
        if (contrato?.retem_irpj) taxes.val_irpj = bruto * 0.0150;
        if (contrato?.retem_inss) taxes.val_inss = bruto * 0.1100;

        if (contrato?.retem_caucao) {
            taxes.val_caucao = bruto * (safeRate(contrato.aliquota_caucao) / 100);
        }

        // Calculate Liquid: Subtract taxes ONLY if retention is enabled
        let totalDeductions =
            (contrato?.retem_iss ? taxes.val_iss : 0) +
            taxes.val_pis +
            taxes.val_cofins +
            taxes.val_csll +
            taxes.val_irpj +
            taxes.val_inss;

        const val_liquido_nota = bruto - totalDeductions;
        const val_liquido_recebimento = val_liquido_nota - taxes.val_caucao;

        return { ...taxes, val_liquido_nota, val_liquido_recebimento };
    };



    const handleOpenModal = (faturamento) => {
        const dates = getInitialDates(faturamento);

        if (dates.data_vencimento && faturamento.mes_competencia) {
            const compMonth = parseInt(faturamento.mes_competencia.split('-')[1]);
            const dueMonth = parseInt(dates.data_vencimento.split('-')[1]);
            setIsNextMonth(dueMonth !== compMonth);
        } else {
            setIsNextMonth(false);
        }
        setCurrentFaturamento({ ...faturamento, ...dates });
        setCalculatedValues(calculateTaxValues(faturamento.valor_bruto, faturamento.contratos));
        setModalMode('EDIT');
        setIsModalOpen(true);
    };

    const handleBrutoChange = (newVal) => {
        const updated = { ...currentFaturamento, valor_bruto: newVal };
        setCurrentFaturamento(updated);
        setCalculatedValues(calculateTaxValues(newVal, currentFaturamento.contratos));
    };

    const handleSave = async (e, overrideStatus = null) => {
        // Debug check
        // alert('Iniciando salvamento...'); // Uncomment to debug if button is dead

        if (e) e.preventDefault();
        try {
            // 1. Data Cleaning & Validation Helpers
            const cleanCurrency = (val) => {
                if (typeof val === 'number') return val;
                if (!val) return 0;

                let str = val.toString();
                // If it looks like a standard float (e.g. "1200.50"), parse directly.
                if (/^-?\d+(\.\d+)?$/.test(str)) return parseFloat(str);

                // Handling Brazilian format (e.g. "1.200,50")
                // Remove non-numeric characters except comma and dot
                str = str.replace(/[^\d,\.]/g, '');

                // If it has commas, it's likely decimal separator in BR format
                if (str.includes(',')) {
                    str = str.replace(/\./g, ''); // Remove thousand separators (dots)
                    str = str.replace(',', '.'); // Replace comma with dot
                }

                return parseFloat(str);
            };

            const cleanDate = (val) => {
                if (!val) return null;
                // If format is DD/MM/YYYY, flip it.
                if (val.includes('/') && val.length === 10) {
                    const [day, month, year] = val.split('/');
                    return `${year}-${month}-${day}`;
                }
                return val; // Assume ISO YYYY-MM-DD
            };

            // 2. Parse Values
            const valorBrutoFloat = cleanCurrency(currentFaturamento.valor_bruto);
            const vencimentoISO = cleanDate(currentFaturamento.data_vencimento);
            const emissaoISO = cleanDate(currentFaturamento.data_emissao);

            if (isNaN(valorBrutoFloat)) throw new Error("Valor Bruto inválido. Use formato numérico (ex: 1200.50)");
            if (!vencimentoISO) throw new Error("Data de Vencimento inválida.");

            // 3. Recalculate Taxes with Cleaner Value
            const newValues = calculateTaxValues(valorBrutoFloat, currentFaturamento.contratos);

            // 4. Construct Payload
            const payload = {
                valor_bruto: valorBrutoFloat,
                status: overrideStatus || currentFaturamento.status,
                data_vencimento: vencimentoISO,
                data_emissao: emissaoISO,
                ...newValues
            };

            // FIX: Update competency month if emission date changed
            if (emissaoISO) {
                const [year, month] = emissaoISO.split('-');
                payload.mes_competencia = `${year}-${month}-01`;
            }

            const { error } = await supabase
                .from('faturamentos')
                .update(payload)
                .eq('id', currentFaturamento.id);

            if (error) throw error;

            fetchFaturamentos();
            setIsModalOpen(false);

            const successMsg = overrideStatus === 'Faturado' ? 'Faturamento emitido com sucesso!' : 'Alterações salvas com sucesso!';
            setFeedbackModal({ open: true, type: 'success', title: 'Sucesso!', message: successMsg });

        } catch (error) {
            console.error('Save error:', error);
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: 'Erro ao salvar: ' + (error.message || error) });
        }
    };

    const handleDelete = (id) => {
        // Logic moved to confirmDelete
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const { error } = await supabase
                .from('faturamentos')
                .delete()
                .eq('id', itemToDelete.id);

            if (error) throw error;

            fetchFaturamentos();
            setDeleteModalOpen(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir:', error);
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: 'Erro ao excluir faturamento: ' + error.message });
        }
    };

    const handleFaturar = (id) => {
        setConfirmFaturarModal({ open: true, id: id });
    };

    const executeFaturamento = async () => {
        const id = confirmFaturarModal.id;
        if (!id) return;
        setConfirmFaturarModal({ open: false, id: null });

        // Bloqueio de UI
        setLoading(true);

        try {
            // Verificação Prévia (Check de Idempotência)
            const { data: existing, error: checkError } = await supabase
                .from('recebimentos')
                .select('id')
                .eq('faturamento_id', id)
                .maybeSingle();

            if (existing) {
                setLoading(false);
                setFeedbackModal({ open: true, type: 'error', title: 'Atenção!', message: 'Este faturamento já possui um recebimento gerado.' });
                return;
            }

            // STEP A: Update Faturamento
            const { error: errorUpdate } = await supabase
                .from('faturamentos')
                .update({ status: 'Faturado' })
                .eq('id', id);

            if (errorUpdate) {
                console.error("Step A Failed:", errorUpdate);
                throw new Error("Falha ao atualizar status do faturamento.");
            }

            // STEP B: Generate Recebimento (Financeiro)
            if (!currentFaturamento || !calculatedValues) {
                throw new Error("Dados do faturamento não carregados para o financeiro.");
            }

            const payloadRecebimento = {
                faturamento_id: id,
                empresa_id: currentFaturamento.contratos?.empresa_id,
                valor: calculatedValues.val_liquido_recebimento,
                data_vencimento: currentFaturamento.data_vencimento,
                status: 'Pendente'
            };

            const { error: errorInsert } = await supabase
                .from('recebimentos')
                .insert([payloadRecebimento]);

            if (errorInsert) {
                console.error("Step B Failed:", errorInsert);

                // ROLLBACK STEP A
                await supabase.from('faturamentos').update({ status: 'Pendente' }).eq('id', id);

                throw new Error("Falha ao criar recebimento financeiro (Operação cancelada): " + errorInsert.message);
            }

            // Success feedback
            await fetchFaturamentos();
            setIsModalOpen(false);
            setFeedbackModal({ open: true, type: 'success', title: 'Sucesso!', message: 'Faturamento realizado e Recebimento gerado com sucesso!' });

        } catch (error) {
            console.error('Erro geral ao faturar:', error);
            // Rollback (Try to revert status if it crashed halfway)
            await supabase.from('faturamentos').update({ status: 'Pendente' }).eq('id', id);
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUndoClick = (id) => {
        setUndoModalOpen({ open: true, id: id });
    };

    const handleUndoConfirm = async () => {
        const id = undoModalOpen.id;
        if (!id) return;
        setUndoModalOpen({ open: false, id: null });

        try {
            // Step 1: Delete Recebimento (Financeiro)
            const { error: errorDelete } = await supabase
                .from('recebimentos')
                .delete()
                .eq('faturamento_id', id);

            if (errorDelete) throw new Error("Erro ao excluir registro financeiro: " + errorDelete.message);

            // Step 2: Revert Faturamento Status
            const { error: errorUpdate } = await supabase
                .from('faturamentos')
                .update({ status: 'Pendente' })
                .eq('id', id);

            if (errorUpdate) throw new Error("Erro ao reverter status do faturamento: " + errorUpdate.message);

            fetchFaturamentos();
            setFeedbackModal({ open: true, type: 'success', title: 'Sucesso!', message: 'Faturamento estornado com sucesso!' });
        } catch (error) {
            console.error('Erro ao estornar:', error);
            setFeedbackModal({ open: true, type: 'error', title: 'Erro!', message: error.message });
        }
    };

    const handleOpenViewModal = (faturamento) => {
        const dates = getInitialDates(faturamento);

        // Lógica para detectar se o vencimento atual já é no próximo mês em relação à competência
        if (dates.data_vencimento && faturamento.mes_competencia) {
            const compMonth = parseInt(faturamento.mes_competencia.split('-')[1]);
            const dueMonth = parseInt(dates.data_vencimento.split('-')[1]);
            // Se meses diferentes (e não for virada de ano Dez->Jan que daria erro simples, mas assumindo fluxo normal +1)
            setIsNextMonth(dueMonth !== compMonth);
        } else {
            setIsNextMonth(false);
        }
        setCurrentFaturamento({ ...faturamento, ...dates });
        setCalculatedValues(calculateTaxValues(faturamento.valor_bruto, faturamento.contratos));
        setModalMode('VIEW');
        setIsModalOpen(true);
    };

    // Filtering logic
    const itemsForStats = faturamentos.filter(f => {
        const matchesSearch = (f.contratos?.postos_trabalho?.nome_posto || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEmpresa = filterEmpresa ? (f.contratos?.empresas?.nome || '').toLowerCase().includes(filterEmpresa.toLowerCase()) : true;
        return matchesSearch && matchesEmpresa;
    });

    const filteredItems = itemsForStats.filter(f => {
        const matchesStatus = filterStatus ? f.status === filterStatus : true;
        return matchesStatus;
    });

    const stats = useMemo(() => {
        return itemsForStats.reduce((acc, curr) => {
            const val = parseFloat(curr.valor_bruto || 0);
            acc.total += val;
            if (curr.status === 'Pendente') acc.pendente += val;
            if (curr.status === 'Faturado') acc.faturado += val;
            return acc;
        }, { total: 0, pendente: 0, faturado: 0 });
    }, [itemsForStats]);

    // Lógica robusta de datas (Timezone Safe)
    const getInitialDates = (faturamento) => {
        const result = {
            data_vencimento: faturamento.data_vencimento || '',
            data_emissao: faturamento.data_emissao || new Date().toISOString().slice(0, 10)
        };

        if (!result.data_vencimento && faturamento.mes_competencia && faturamento.contratos?.dia_vencimento_padrao) {
            const [year, month] = faturamento.mes_competencia.split('-'); // YYYY, MM
            const day = faturamento.contratos.dia_vencimento_padrao;

            // Cria a data no meio-dia para evitar problemas de fuso horário (UTC-3)
            const baseDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);

            result.data_vencimento = baseDate.toISOString().slice(0, 10);
        }

        return result;
    };

    const toggleVencimentoMonth = (shouldBeNextMonth) => {
        setIsNextMonth(shouldBeNextMonth);

        if (!currentFaturamento?.mes_competencia || !currentFaturamento?.contratos?.dia_vencimento_padrao) return;

        const [yearStr, monthStr] = currentFaturamento.mes_competencia.split('-');
        let year = parseInt(yearStr);
        let month = parseInt(monthStr); // 1-12
        const day = parseInt(currentFaturamento.contratos.dia_vencimento_padrao);

        if (shouldBeNextMonth) {
            month += 1;
            if (month > 12) { month = 1; year += 1; }
        }

        // Gera nova data segura (meio-dia)
        const newDate = new Date(year, month - 1, day, 12, 0, 0);
        const newDateStr = newDate.toISOString().slice(0, 10);

        setCurrentFaturamento(prev => ({ ...prev, data_vencimento: newDateStr }));
    };

    const getEmpresaStripColor = (nomeEmpresa) => {
        const nome = (nomeEmpresa || '').toLowerCase();
        if (nome.includes('femog')) return '#2563eb';
        if (nome.includes('semog')) return '#f97316';
        return '#9ca3af';
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="ml-0 md:ml-72 transition-all duration-300 flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden text-slate-900 relative">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <DollarSign className="text-blue-600" /> Gestão de Faturamentos
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">
                                Controle e emissão de notas fiscais mensais
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="month"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <button
                                onClick={handleGenerateCompetencia}
                                disabled={loadingGen}
                                className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-500/20 font-medium text-sm disabled:opacity-50"
                            >
                                {loadingGen ? <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> : <Calendar size={18} />}
                                <span>Gerar Competência</span>
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Previsto</p>
                                <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(stats.total)}</h3>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <DollarSign className="text-blue-600" size={24} />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Pendente</p>
                                <h3 className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(stats.pendente)}</h3>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg">
                                <Clock className="text-orange-600" size={24} />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Faturado</p>
                                <h3 className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(stats.faturado)}</h3>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-lg">
                                <CheckCircle className="text-emerald-600" size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Filter Bar (Pixel Perfect Style) */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 shadow-sm">
                        <div className="relative w-full md:w-[40%]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por posto..."
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
                                <option value="Pendente">Pendente</option>
                                <option value="Faturado">Faturado</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                        {/* VIEW MOBILE: CARDS */}
                        <div className="block md:hidden space-y-3 p-3 bg-slate-50">
                            {filteredItems.map((fat) => (
                                <div key={fat.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getEmpresaStripColor(fat.contratos?.empresas?.nome) }}></div>
                                    <div className="pl-3">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-mono text-slate-500">{fat.data_emissao ? new Date(fat.data_emissao).toLocaleDateString() : '-'}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${fat.status === 'Faturado' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                                {fat.status}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 text-sm line-clamp-2">{fat.contratos?.postos_trabalho?.nome_posto}</h4>
                                        <div className="mt-3 flex justify-between items-end bg-gray-50 p-2 rounded-lg">
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase">Líquido</p>
                                                <p className="font-bold text-slate-700">{formatCurrency(fat.val_liquido_recebimento)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 uppercase">Bruto</p>
                                                <p className="font-medium text-slate-500 text-xs">{formatCurrency(fat.valor_bruto)}</p>
                                            </div>
                                        </div>

                                        {/* Botões de Ação */}
                                        <div className="flex items-center justify-end space-x-2 mt-3 pt-2 border-t border-slate-100">
                                            {fat.status === 'Faturado' ? (
                                                <button onClick={(e) => { e.stopPropagation(); handleUndoClick(fat.id); }} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Desfazer Faturamento">
                                                    <RotateCcw size={16} />
                                                </button>
                                            ) : (
                                                <>
                                                    <button onClick={(e) => { e.stopPropagation(); handleOpenModal(fat); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(fat); }} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
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
                                        <th className="p-4 font-semibold pl-6">Data Emissão</th>
                                        <th className="p-4 font-semibold">Posto (Contrato)</th>
                                        <th className="p-4 font-semibold">Empresa</th>
                                        <th className="p-4 font-semibold">Valor Bruto</th>
                                        <th className="p-4 font-semibold">Líquido Receber</th>
                                        <th className="p-4 font-semibold">Status</th>
                                        <th className="p-4 font-semibold text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredItems.map((fat) => (
                                        <tr
                                            key={fat.id}
                                            onClick={() => handleOpenViewModal(fat)}
                                            className="hover:bg-gray-50 transition-colors relative cursor-pointer group"
                                        >
                                            <td className="relative p-0">
                                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: getEmpresaStripColor(fat.contratos?.empresas?.nome) }}></div>
                                                <div className="py-4 pr-4 pl-6 font-medium text-slate-700">
                                                    {fat.data_emissao ? new Date(fat.data_emissao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-normal text-slate-900">
                                                    <div>{fat.contratos?.postos_trabalho?.nome_posto}</div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${(fat.contratos?.empresas?.nome || '').toLowerCase().includes('semog')
                                                    ? 'bg-orange-50 text-orange-700 border-orange-100'
                                                    : (fat.contratos?.empresas?.nome || '').toLowerCase().includes('femog')
                                                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                        : 'bg-gray-50 text-slate-700 border-gray-100'
                                                    }`}>
                                                    {fat.contratos?.empresas?.nome}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-slate-900">{formatCurrency(fat.valor_bruto)}</td>
                                            <td className="p-4 font-medium text-slate-700">{formatCurrency(fat.val_liquido_recebimento)}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${fat.status === 'Faturado' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                                    {fat.status === 'Faturado' ? <CheckCircle size={12} className="mr-1" /> : <AlertCircle size={12} className="mr-1" />}
                                                    {fat.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    {fat.status === 'Faturado' ? (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleUndoClick(fat.id); }}
                                                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Desfazer Faturamento"
                                                        >
                                                            <RotateCcw size={16} />
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleOpenModal(fat); }}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(fat); }}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Excluir"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* The Calculator Modal */}
                {isModalOpen && currentFaturamento && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100">
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gray-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Calculator size={18} className="text-blue-600" />
                                    {modalMode === 'EDIT' ? 'Calculadora de Faturamento' : 'Detalhes do Faturamento'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
                            </div>

                            <div className="p-6">
                                <div className="space-y-4 mb-6">
                                    {/* Row 1: Dates */}
                                    <div className="flex flex-col md:flex-row gap-4">
                                        {/* Data Emissão (50%) */}
                                        <div className="w-full md:w-1/2">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data de Emissão</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Calendar size={16} /></div>
                                                <input
                                                    type="date"
                                                    required
                                                    readOnly={modalMode === 'VIEW'}
                                                    value={currentFaturamento.data_emissao || ''}
                                                    onChange={(e) => setCurrentFaturamento({ ...currentFaturamento, data_emissao: e.target.value })}
                                                    className={`w-full pl-9 pr-3 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${modalMode === 'VIEW' ? 'bg-gray-50 text-slate-600' : ''}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Data Vencimento (50%) */}
                                        <div className="w-full md:w-1/2">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Data de Vencimento</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><Calendar size={16} /></div>
                                                <input
                                                    type="date"
                                                    required
                                                    readOnly={modalMode === 'VIEW'}
                                                    value={currentFaturamento.data_vencimento || ''}
                                                    onChange={(e) => setCurrentFaturamento({ ...currentFaturamento, data_vencimento: e.target.value })}
                                                    className={`w-full pl-9 pr-3 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${modalMode === 'VIEW' ? 'bg-gray-50 text-slate-600' : ''}`}
                                                />
                                            </div>
                                        </div>
                                        {/* Toggle Próximo Mês */}

                                    </div>

                                    {/* Row 2: Value (100%) */}
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Valor Bruto (R$)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><DollarSign size={16} /></div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                required
                                                readOnly={modalMode === 'VIEW'}
                                                value={currentFaturamento.valor_bruto}
                                                onChange={(e) => handleBrutoChange(e.target.value)}
                                                className={`w-full pl-9 pr-3 py-3 bg-white border border-slate-300 rounded-lg text-lg font-bold text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${modalMode === 'VIEW' ? 'bg-gray-50 text-slate-600' : ''}`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Math Breakdown */}
                                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6 font-mono text-sm">
                                    <div className="flex justify-between text-slate-600">
                                        <span>(-) ISS</span>
                                        <span>{formatCurrency(calculatedValues.val_iss)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>(-) PIS/COFINS/CSLL/IR/INSS</span>
                                        <span>{formatCurrency(calculatedValues.val_pis + calculatedValues.val_cofins + calculatedValues.val_csll + calculatedValues.val_irpj + calculatedValues.val_inss)}</span>
                                    </div>
                                    <div className="border-t border-gray-200 my-2 pt-2 flex justify-between font-bold text-slate-700">
                                        <span>= Líquido da Nota</span>
                                        <span>{formatCurrency(calculatedValues.val_liquido_nota)}</span>
                                    </div>

                                    {calculatedValues.val_caucao > 0 && (
                                        <div className="flex justify-between text-orange-600 bg-orange-50 p-2 rounded -mx-2">
                                            <span className="flex items-center gap-1"><AlertCircle size={12} /> Retenção Caução</span>
                                            <span>-{formatCurrency(calculatedValues.val_caucao)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center mb-6">
                                    <p className="text-xs text-blue-600 uppercase font-bold tracking-wider mb-1">Valor Líquido a Receber</p>
                                    <p className="text-3xl font-extrabold text-blue-700">{formatCurrency(calculatedValues.val_liquido_recebimento)}</p>
                                </div>

                                {/* Toggle Próximo Mês - Reposicionado */}
                                {modalMode === 'EDIT' && (
                                    <div className="flex items-center justify-center mb-6 pt-4 border-t border-slate-100">
                                        <label className="inline-flex items-center cursor-pointer group select-none">
                                            <span className={`mr-3 text-sm font-medium transition-colors ${isNextMonth ? 'text-blue-600 font-bold' : 'text-slate-500'}`}>
                                                {isNextMonth ? 'Vencimento Jogar para Próximo Mês' : 'Manter Vencimento no Mês Atual'}
                                            </span>
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={isNextMonth}
                                                    onChange={(e) => toggleVencimentoMonth(e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
                                        {modalMode === 'VIEW' ? 'Fechar' : 'Cancelar'}
                                    </button>

                                    {modalMode === 'EDIT' && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleSave(null);
                                            }}
                                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg flex items-center gap-2"
                                        >
                                            <Save size={16} /> Salvar Alterações
                                        </button>
                                    )}

                                    {modalMode === 'VIEW' && currentFaturamento.status === 'Pendente' && (
                                        <button
                                            type="button"
                                            onClick={() => handleFaturar(currentFaturamento.id)}
                                            className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-lg flex items-center gap-2"
                                        >
                                            <CheckCircle size={16} /> Faturar Agora
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}


            </div>

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
                                    Tem certeza que deseja excluir o faturamento emitido em <strong>{itemToDelete.data_emissao ? new Date(itemToDelete.data_emissao).toLocaleDateString() : 'Data desconhecida'}</strong>? Esta ação não pode ser desfeita.
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
                )
            }

            {/* Confirm Faturar Modal */}
            {
                confirmFaturarModal.open && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="text-emerald-600" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Confirmar Emissão</h3>
                                <p className="text-slate-600 text-sm mb-6">
                                    Confirma a emissão deste faturamento? <br />
                                    Isso gerará automaticamente um registro no Financeiro.
                                </p>
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <button
                                        onClick={() => setConfirmFaturarModal({ open: false, id: null })}
                                        className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={executeFaturamento}
                                        className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-lg shadow-emerald-500/30 transition-all text-sm block"
                                    >
                                        Sim, Emitir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Undo Confirmation Modal */}
            {
                undoModalOpen.open && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="text-orange-600" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Desfazer Faturamento?</h3>
                                <p className="text-slate-600 text-sm mb-6">
                                    Esta ação irá reverter o status para Pendente e excluirá permanentemente o registro financeiro associado (mesmo se já estiver baixado). <br />
                                    Deseja continuar?
                                </p>
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <button
                                        onClick={() => setUndoModalOpen({ open: false, id: null })}
                                        className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg font-medium transition-colors text-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleUndoConfirm}
                                        className="w-full px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium shadow-lg shadow-orange-500/30 transition-all text-sm block"
                                    >
                                        Sim, Desfazer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Feedback Modal (Success/Error) */}
            {
                feedbackModal.open && (
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
                )
            }
        </div >
    );
};

export default Faturamentos;
