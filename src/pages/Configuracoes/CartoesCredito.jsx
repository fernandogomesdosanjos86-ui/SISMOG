import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import { useToast } from '../../components/ui/Toast';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import CompanyTabs from '../../components/ui/CompanyTabs';
import InputMask from '../../components/ui/InputMask';
import TableActionButtons from '../../components/ui/TableActionButtons';
import TableFilters from '../../components/ui/TableFilters';
import StatusBadge from '../../components/ui/StatusBadge';
import CompanyBadge from '../../components/ui/CompanyBadge';
import { getBorderColor } from '../../utils/styles';
import { formatCurrency, parseCurrency } from '../../utils/formatters';
import { cartoesCreditoService } from '../../services/cartoesCreditoService';
import { empresasService } from '../../services/empresasService';

const schema = z.object({
    empresa_id: z.string().min(1, 'Selecione uma empresa'),
    banco: z.string().min(1, 'Banco é obrigatório'),
    bandeira: z.string().min(1, 'Bandeira é obrigatória'),
    numero_cartao: z.string().min(4, 'Número do cartão inválido'),
    limite: z.union([z.string(), z.number()]).transform(parseCurrency),
    nome_cartao: z.string().min(1, 'Nome no cartão é obrigatório'),
    ativo: z.boolean().default(true),
});

export default function CartoesCredito() {
    const [items, setItems] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedItem, setSelectedItem] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const { addToast } = useToast();
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            ativo: true,
            limite: 0
        }
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [itemsData, empresasData] = await Promise.all([
                cartoesCreditoService.getAll(),
                empresasService.getAll()
            ]);
            setItems(itemsData || []);
            setEmpresas(empresasData || []);
        } catch (error) {
            addToast({ type: 'error', title: 'Erro', message: 'Falha ao carregar dados.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleOpenCreate = () => {
        setModalMode('create');
        setSelectedItem(null);
        reset({
            empresa_id: '', banco: '', bandeira: '', numero_cartao: '',
            limite: 0, nome_cartao: '', ativo: true
        });
        setShowModal(true);
    };

    // Função de Visualização Padronizada
    const handleOpenView = (item) => {
        setModalMode('view');
        setSelectedItem(item);
        Object.keys(item).forEach(key => {
            setValue(key, item[key]);
        });
        setShowModal(true);
    };

    const handleSwitchToEdit = () => { setModalMode('edit'); };

    const onSubmit = async (data) => {
        try {
            setActionLoading(true);
            if (modalMode === 'edit' && selectedItem) {
                await cartoesCreditoService.update(selectedItem.id, data);
                addToast({ type: 'success', title: 'Sucesso', message: 'Cartão atualizado.' });
            } else {
                await cartoesCreditoService.create(data);
                addToast({ type: 'success', title: 'Sucesso', message: 'Cartão criado.' });
            }
            fetchData();
            setShowModal(false);
        } catch (error) {
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao salvar.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            await cartoesCreditoService.delete(itemToDelete.id);
            setItems(prev => prev.filter(i => i.id !== itemToDelete.id));
            addToast({ type: 'success', title: 'Excluído', message: 'Cartão removido.' });
        } catch (error) {
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao excluir.' });
        } finally {
            setShowDeleteModal(false);
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.banco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.empresas?.nome_empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.nome_cartao?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' ? true : item.empresa_id === activeTab;
        return matchesSearch && matchesTab;
    });

    const isViewMode = modalMode === 'view'; // Flag de controle de UI

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Cartões de Crédito</h1>
                <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center hover:bg-blue-700 transition-all active:scale-95">
                    <Plus className="h-5 w-5" /> Novo Cartão
                </button>
            </div>

            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por banco, empresa ou nome..."
            />

            <CompanyTabs activeTab={activeTab} onTabChange={setActiveTab} empresas={empresas} />

            {/* Desktop Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hidden md:block">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs uppercase text-slate-500 font-semibold">Banco/Bandeira</th>
                            <th className="px-6 py-3 text-xs uppercase text-slate-500 font-semibold">Empresa</th>
                            <th className="px-6 py-3 text-xs uppercase text-slate-500 font-semibold text-right">Limite</th>
                            <th className="px-6 py-3 text-xs uppercase text-slate-500 font-semibold">Nº Cartão</th>
                            <th className="px-6 py-3 text-xs uppercase text-slate-500 font-semibold text-center">Status</th>
                            <th className="px-6 py-3 text-xs uppercase text-slate-500 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredItems.map((item) => (
                            <tr
                                key={item.id}
                                onClick={() => handleOpenView(item)} // Clique na linha
                                className={clsx(
                                    "hover:bg-slate-50 border-l-4 transition-colors cursor-pointer", // cursor-pointer adicionado
                                    getBorderColor(item.empresas?.nome_empresa)
                                )}
                            >
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{item.banco}</div>
                                    <div className="text-xs text-slate-500">{item.bandeira}</div>
                                </td>
                                <td className="px-6 py-4"><CompanyBadge nomeEmpresa={item.empresas?.nome_empresa} /></td>
                                <td className="px-6 py-4 font-bold text-emerald-700 text-right">{formatCurrency(item.limite)}</td>
                                <td className="px-6 py-4 text-slate-600 font-mono text-sm">•••• {item.numero_cartao?.slice(-4)}</td>
                                <td className="px-6 py-4 text-center"><StatusBadge value={item.ativo} /></td>
                                <td className="px-6 py-4 text-right">
                                    <TableActionButtons
                                        onView={() => handleOpenView(item)} // onView habilitado
                                        onEdit={() => { handleOpenView(item); handleSwitchToEdit(); }}
                                        onDelete={() => { setItemToDelete(item); setShowDeleteModal(true); }}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {filteredItems.map(item => (
                    <div
                        key={item.id}
                        onClick={() => handleOpenView(item)} // Clique no card mobile
                        className={clsx(
                            "bg-white p-4 rounded-lg shadow-sm border-l-4 space-y-3 cursor-pointer",
                            getBorderColor(item.empresas?.nome_empresa)
                        )}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-900">{item.banco}</h3>
                                <p className="text-xs text-slate-500 uppercase">{item.bandeira}</p>
                            </div>
                            <StatusBadge value={item.ativo} />
                        </div>
                        <div className="flex items-center justify-between">
                            <CompanyBadge nomeEmpresa={item.empresas?.nome_empresa} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm border-t border-b border-slate-100 py-2">
                            <div>
                                <p className="text-xs text-slate-500">Limite</p>
                                <p className="font-bold text-emerald-600">{formatCurrency(item.limite)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Final Cartão</p>
                                <p className="font-mono text-slate-700">•••• {item.numero_cartao?.slice(-4)}</p>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <TableActionButtons
                                onView={() => handleOpenView(item)}
                                onEdit={() => { handleOpenView(item); handleSwitchToEdit(); }}
                                onDelete={() => { setItemToDelete(item); setShowDeleteModal(true); }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Formulário (Centralizado) */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">
                                {modalMode === 'create' ? 'Novo Cartão' : isViewMode ? 'Detalhes' : 'Editar Cartão'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Empresa</label>
                                <select
                                    disabled={isViewMode} // Desabilitado em modo de leitura
                                    {...register('empresa_id')}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white disabled:bg-slate-50 disabled:text-slate-500"
                                >
                                    <option value="">Selecione...</option>
                                    {empresas.filter(e => e.ativo).map(e => (
                                        <option key={e.id} value={e.id}>{e.nome_empresa}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Banco</label>
                                    <input type="text" disabled={isViewMode} {...register('banco')} className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50 disabled:text-slate-500" placeholder="Ex: Nubank" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Bandeira</label>
                                    <input type="text" disabled={isViewMode} {...register('bandeira')} className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50 disabled:text-slate-500" placeholder="Ex: Mastercard" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Número do Cartão</label>
                                    <input type="text" disabled={isViewMode} {...register('numero_cartao')} className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50 disabled:text-slate-500" placeholder="0000 0000 0000 0000" />
                                </div>
                                <InputMask label="Limite (R$)" mask="currency" disabled={isViewMode} error={errors.limite} {...register('limite')} />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Nome no Cartão</label>
                                <input type="text" disabled={isViewMode} {...register('nome_cartao')} className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50 disabled:text-slate-500" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Status</label>
                                <select
                                    disabled={isViewMode}
                                    {...register('ativo', { setValueAs: v => v === 'true' || v === true })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white disabled:bg-slate-50"
                                >
                                    <option value={true}>Ativo</option>
                                    <option value={false}>Inativo</option>
                                </select>
                            </div>
                        </form>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                                {isViewMode ? 'Fechar' : 'Cancelar'}
                            </button>

                            {isViewMode ? (
                                <button
                                    onClick={handleSwitchToEdit} // Botão Editar em modo leitura
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Editar
                                </button>
                            ) : (
                                <button onClick={handleSubmit(onSubmit)} disabled={actionLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                                    {actionLoading && <span className="animate-spin text-xs">⏳</span>} Salvar Dados
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal isOpen={showDeleteModal} title="Excluir Cartão" message="O cartão será enviado para a lixeira." onConfirm={handleDelete} onCancel={() => setShowDeleteModal(false)} />
        </div>
    );
}
