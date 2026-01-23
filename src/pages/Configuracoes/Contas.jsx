import { useState, useEffect } from 'react';
import { Plus, Search, Landmark, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';

// --- SERVIÇOS ---
import { contasService } from '../../services/contasService';
import { empresasService } from '../../services/empresasService';

// --- INFRAESTRUTURA COMPARTILHADA ---
import { useToast } from '../../components/ui/Toast';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import CompanyTabs from '../../components/ui/CompanyTabs';
import StatusBadge from '../../components/ui/StatusBadge';
import InputMask from '../../components/ui/InputMask';
import TableActionButtons from '../../components/ui/TableActionButtons';
import TableFilters from '../../components/ui/TableFilters';
import { getBorderColor } from '../../utils/styles';
import CompanyBadge from '../../components/ui/CompanyBadge';

// --- SCHEMA ---
const contaSchema = z.object({
    empresa_id: z.string().min(1, 'Selecione uma empresa'),
    nome_banco: z.string().min(3, 'Nome do banco obrigatório'),
    cod_banco: z.string().min(1, 'Código obrigatório'),
    agencia: z.string().min(1, 'Agência obrigatória'),
    num_conta: z.string().min(1, 'Número da conta obrigatório'),
    ativo: z.boolean().default(true),
});

export default function Contas() {
    const [contas, setContas] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedConta, setSelectedConta] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const { addToast } = useToast();

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(contaSchema),
        defaultValues: { ativo: true }
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [contasData, empresasData] = await Promise.all([
                contasService.getAll(),
                empresasService.getAll()
            ]);
            setContas(contasData || []);
            setEmpresas(empresasData || []);
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: 'Falha ao carregar dados.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleOpenCreate = () => {
        setModalMode('create');
        setSelectedConta(null);
        reset({
            empresa_id: '',
            nome_banco: '',
            cod_banco: '',
            agencia: '',
            num_conta: '',
            ativo: true
        });
        setShowModal(true);
    };

    const handleOpenView = (conta) => {
        setModalMode('view');
        setSelectedConta(conta);
        setValue('empresa_id', conta.empresa_id);
        setValue('nome_banco', conta.nome_banco);
        setValue('cod_banco', conta.cod_banco);
        setValue('agencia', conta.agencia);
        setValue('num_conta', conta.num_conta);
        setValue('ativo', conta.ativo);
        setShowModal(true);
    };

    const handleSwitchToEdit = () => { setModalMode('edit'); };

    const onSubmit = async (data) => {
        try {
            setActionLoading(true);
            const payload = { ...data };

            if (modalMode === 'edit' && selectedConta) {
                await contasService.update(selectedConta.id, payload);
                addToast({ type: 'success', title: 'Sucesso', message: 'Conta atualizada.' });
            } else {
                await contasService.create(payload);
                addToast({ type: 'success', title: 'Sucesso', message: 'Conta cadastrada.' });
            }
            fetchData();
            setShowModal(false);
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao salvar conta.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await contasService.delete(itemToDelete.id);
            setContas(prev => prev.filter(c => c.id !== itemToDelete.id));
            addToast({ type: 'success', title: 'Excluído', message: 'Conta removida.' });
        } catch (error) {
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao excluir.' });
        } finally {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    const filteredContas = contas.filter(c => {
        const matchesSearch =
            c.nome_banco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.empresas?.nome_empresa?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' ? true : c.empresa_id === activeTab;
        return matchesSearch && matchesTab;
    });

    const isViewMode = modalMode === 'view';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Contas</h1>
                    <p className="text-slate-500">Gestão de contas e dados bancários</p>
                </div>
                <button onClick={handleOpenCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors active:scale-95">
                    <Plus className="h-5 w-5" /> Nova Conta
                </button>
            </div>

            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por banco ou empresa..."
            />

            <CompanyTabs activeTab={activeTab} onTabChange={setActiveTab} empresas={empresas} />

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hidden md:block">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Banco</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Empresa</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Agência / Conta</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredContas.map((item) => (
                            <tr key={item.id} onClick={() => handleOpenView(item)} className={clsx("hover:bg-slate-50 transition-colors cursor-pointer border-l-4", getBorderColor(item.empresas?.nome_empresa))}>
                                <td className="px-6 py-4">
                                    <div><p className="font-bold text-slate-900">{item.nome_banco}</p><p className="text-xs text-slate-500">Cód: {item.cod_banco}</p></div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    <CompanyBadge nomeEmpresa={item.empresas?.nome_empresa} />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col text-sm"><span className="text-slate-600">Ag: <span className="font-medium text-slate-900">{item.agencia}</span></span><span className="text-slate-600">CC: <span className="font-medium text-slate-900">{item.num_conta}</span></span></div>
                                </td>
                                <td className="px-6 py-4 text-center"><StatusBadge value={item.ativo} /></td>
                                <td className="px-6 py-4"><TableActionButtons onView={() => handleOpenView(item)} onEdit={() => { handleOpenView(item); handleSwitchToEdit(); }} onDelete={() => { setItemToDelete(item); setShowDeleteModal(true); }} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {filteredContas.map(item => (
                    <div key={item.id} onClick={() => handleOpenView(item)} className={clsx("bg-white p-4 rounded-lg shadow-sm border-l-4 space-y-3 cursor-pointer", getBorderColor(item.empresas?.nome_empresa))}>
                        <div className="flex justify-between items-start"><h3 className="font-bold text-slate-900 flex items-center gap-2">{item.nome_banco}</h3><StatusBadge value={item.ativo} /></div>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                            <CompanyBadge nomeEmpresa={item.empresas?.nome_empresa} />
                        </p>
                        <div className="bg-slate-50 p-2 rounded text-sm text-slate-700 flex justify-between"><span>Ag: <strong>{item.agencia}</strong></span><span>CC: <strong>{item.num_conta}</strong></span></div>
                        <div className="flex justify-end pt-2 border-t border-slate-100"><TableActionButtons onEdit={() => { handleOpenView(item); handleSwitchToEdit(); }} onDelete={() => { setItemToDelete(item); setShowDeleteModal(true); }} /></div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative z-10 p-6 flex flex-col max-h-[90vh]">
                        <h3 className="text-lg font-bold mb-4">{modalMode === 'create' ? 'Nova Conta' : 'Detalhes'}</h3>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto">
                            <div className="space-y-1.5"><label className="text-sm font-medium">Empresa</label><select disabled={isViewMode} {...register('empresa_id')} className="w-full border rounded p-2"><option value="">Selecione...</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.nome_empresa}</option>)}</select></div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2"><InputMask label="Nome do Banco" disabled={isViewMode} error={errors.nome_banco} {...register('nome_banco')} /></div>
                                <InputMask label="Cód. Banco" disabled={isViewMode} error={errors.cod_banco} {...register('cod_banco')} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputMask label="Agência" disabled={isViewMode} error={errors.agencia} {...register('agencia')} />
                                <InputMask label="Conta" disabled={isViewMode} error={errors.num_conta} {...register('num_conta')} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Status</label>
                                <select
                                    disabled={isViewMode}
                                    {...register('ativo', {
                                        setValueAs: v => v === 'true' || v === true
                                    })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                                >
                                    <option value="true">Ativo</option>
                                    <option value="false">Inativo</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancelar</button>
                                {!isViewMode ? (
                                    <button
                                        type="button"
                                        onClick={handleSubmit(onSubmit)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Salvando...' : 'Salvar Dados'}
                                    </button>
                                ) : (
                                    <button type="button" onClick={handleSwitchToEdit} className="px-4 py-2 bg-blue-600 text-white rounded">
                                        Editar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={showDeleteModal}
                title="Excluir Conta"
                message="Tem certeza?"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
            />
        </div>
    );
}