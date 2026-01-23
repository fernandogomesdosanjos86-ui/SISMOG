import { useState, useEffect } from 'react';
import { Plus, Briefcase, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';

// --- SERVIÇOS ---
import { cargosSalariosService as cargosService } from '../../services/cargosSalariosService';
import { empresasService } from '../../services/empresasService';

// --- INFRAESTRUTURA COMPARTILHADA ---
import { useToast } from '../../components/ui/Toast';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import CompanyTabs from '../../components/ui/CompanyTabs';
import InputMask from '../../components/ui/InputMask';
import TableActionButtons from '../../components/ui/TableActionButtons';
import TableFilters from '../../components/ui/TableFilters';
import { getBorderColor } from '../../utils/styles';
import CompanyBadge from '../../components/ui/CompanyBadge';
import { formatCurrency } from '../../utils/formatters';

// --- LISTA DE UFs ---
const UF_LIST = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// --- HELPERS DE CONVERSÃO ---
const parseCurrency = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return Number(val.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
};

const parseNumber = (val) => {
    if (typeof val === 'number') return val;
    return Number(val) || 0;
};

// --- SCHEMA V2 ---
const cargoSchema = z.object({
    empresa_id: z.string().min(1, 'Selecione uma empresa'),
    cargo: z.string().min(3, 'Nome do cargo obrigatório'),
    uf: z.string().min(2, 'Selecione a UF'),
    salario_base: z.union([z.string(), z.number()]).transform(parseCurrency),
    periculosidade_pct: z.union([z.string(), z.number()]).transform(parseNumber),
    adicional_noturno_pct: z.union([z.string(), z.number()]).transform(parseNumber),
    intrajornada_pct: z.union([z.string(), z.number()]).transform(parseNumber),
    outros_pct: z.union([z.string(), z.number()]).transform(parseNumber),
    alimentacao_dia_valor: z.union([z.string(), z.number()]).transform(parseCurrency),
    desconto_alimentacao_valor: z.union([z.string(), z.number()]).transform(parseCurrency),
    servico_extra_diurno_valor: z.union([z.string(), z.number()]).transform(parseCurrency),
    servico_extra_noturno_valor: z.union([z.string(), z.number()]).transform(parseCurrency),
});

export default function CargosSalarios() {
    const [cargos, setCargos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // Estado para as abas

    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedCargo, setSelectedCargo] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const { addToast } = useToast();

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(cargoSchema),
        defaultValues: {
            salario_base: 0, periculosidade_pct: 0, adicional_noturno_pct: 0,
            intrajornada_pct: 0, outros_pct: 0, alimentacao_dia_valor: 0,
            desconto_alimentacao_valor: 0, servico_extra_diurno_valor: 0,
            servico_extra_noturno_valor: 0
        }
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [cargosData, empresasData] = await Promise.all([
                cargosService.getAll(),
                empresasService.getAll()
            ]);
            setCargos(cargosData || []);
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
        setSelectedCargo(null);
        reset({
            empresa_id: '', cargo: '', uf: '', salario_base: 0,
            periculosidade_pct: 0, adicional_noturno_pct: 0, intrajornada_pct: 0,
            outros_pct: 0, alimentacao_dia_valor: 0, desconto_alimentacao_valor: 0,
            servico_extra_diurno_valor: 0, servico_extra_noturno_valor: 0
        });
        setShowModal(true);
    };

    const handleOpenView = (cargo) => {
        setModalMode('view');
        setSelectedCargo(cargo);
        Object.keys(cargo).forEach(key => setValue(key, cargo[key]));
        setShowModal(true);
    };

    const onSubmit = async (data) => {
        try {
            setActionLoading(true);
            if (modalMode === 'edit' && selectedCargo) {
                await cargosService.update(selectedCargo.id, data);
                addToast({ type: 'success', title: 'Sucesso', message: 'Cargo atualizado.' });
            } else {
                await cargosService.create(data);
                addToast({ type: 'success', title: 'Sucesso', message: 'Cargo cadastrado.' });
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
            await cargosService.delete(itemToDelete.id);
            setCargos(prev => prev.filter(c => c.id !== itemToDelete.id));
            addToast({ type: 'success', title: 'Excluído', message: 'Cargo removido.' });
        } catch (error) {
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao excluir.' });
        } finally {
            setShowDeleteModal(false);
        }
    };

    // Lógica de Filtro Duplo (Busca + Abas)
    const filteredCargos = cargos.filter(c => {
        const matchesSearch = c.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.empresas?.nome_empresa?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' ? true : c.empresa_id === activeTab;
        return matchesSearch && matchesTab;
    });

    const isViewMode = modalMode === 'view';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Cargos e Salários</h1>
                <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2 items-center hover:bg-blue-700 transition-all active:scale-95">
                    <Plus className="h-5 w-5" /> Novo Cargo
                </button>
            </div>

            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cargo ou empresa..."
            />

            {/* Abas de Empresa */}
            <CompanyTabs activeTab={activeTab} onTabChange={setActiveTab} empresas={empresas} />

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hidden md:block">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs uppercase text-slate-500 font-semibold">Cargo/UF</th>
                            <th className="px-6 py-3 text-xs uppercase text-slate-500 font-semibold">Empresa</th>
                            <th className="px-6 py-3 text-xs uppercase text-slate-500 font-semibold text-right">Salário Base</th>
                            <th className="px-6 py-3 text-xs uppercase text-slate-500 font-semibold">Alimentação</th>
                            <th className="px-6 py-3 text-xs uppercase text-slate-500 font-semibold">Valor Extra</th>
                            <th className="px-6 py-3 text-xs uppercase text-slate-500 font-semibold text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredCargos.map((item) => (
                            <tr key={item.id} onClick={() => handleOpenView(item)} className={clsx("hover:bg-slate-50 cursor-pointer border-l-4 transition-colors", getBorderColor(item.empresas?.nome_empresa))}>
                                <td className="px-6 py-4 font-bold text-slate-900">{item.cargo}/{item.uf}</td>
                                <td className="px-6 py-4"><CompanyBadge nomeEmpresa={item.empresas?.nome_empresa} /></td>
                                <td className="px-6 py-4 text-right font-bold text-emerald-700">{formatCurrency(item.salario_base)}</td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex flex-col">
                                        <span>Val: {formatCurrency(item.alimentacao_dia_valor)}</span>
                                        <span className="text-red-500 text-xs">Desc: -{formatCurrency(item.desconto_alimentacao_valor)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="flex flex-col">
                                        <span>Diu: {formatCurrency(item.servico_extra_diurno_valor)}</span>
                                        <span>Not: {formatCurrency(item.servico_extra_noturno_valor)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <TableActionButtons
                                        onView={() => handleOpenView(item)}
                                        onEdit={() => { handleOpenView(item); setModalMode('edit'); }}
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
                {filteredCargos.map(item => (
                    <div key={item.id} onClick={() => handleOpenView(item)} className={clsx("bg-white p-4 rounded-lg shadow-sm border-l-4 space-y-3 cursor-pointer", getBorderColor(item.empresas?.nome_empresa))}>
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-slate-900">{item.cargo}/{item.uf}</h3>
                            <CompanyBadge nomeEmpresa={item.empresas?.nome_empresa} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm border-t border-b border-slate-100 py-2">
                            <div><p className="text-xs text-slate-500">Salário Base</p><p className="font-bold text-emerald-600">{formatCurrency(item.salario_base)}</p></div>
                            <div><p className="text-xs text-slate-500">Alim. Diária</p><p className="font-medium">{formatCurrency(item.alimentacao_dia_valor)}</p></div>
                        </div>
                        <div className="flex justify-end pt-2"><TableActionButtons onEdit={() => { handleOpenView(item); setModalMode('edit'); }} onDelete={() => { setItemToDelete(item); setShowDeleteModal(true); }} /></div>
                    </div>
                ))}
            </div>

            {/* Modal de Formulário */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">{modalMode === 'create' ? 'Novo Cargo' : modalMode === 'edit' ? 'Editar Cargo' : 'Detalhes'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-6">
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1">Informações do Cargo</h4>
                                {/* 1ª Linha: Empresa e Cargo */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">Empresa</label>
                                        <select disabled={isViewMode} {...register('empresa_id')} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white disabled:bg-slate-50">
                                            <option value="">Selecione...</option>
                                            {empresas.filter(e => e.ativo).map(e => (
                                                <option key={e.id} value={e.id}>{e.nome_empresa}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <InputMask label="Cargo" disabled={isViewMode} error={errors.cargo} {...register('cargo')} />
                                </div>

                                {/* 2ª Linha: UF e Salário */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">UF</label>
                                        <select disabled={isViewMode} {...register('uf')} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white">
                                            <option value="">UF</option>
                                            {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                        </select>
                                    </div>
                                    <InputMask label="Salário" mask="currency" disabled={isViewMode} {...register('salario_base')} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1">Adicionais (%)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-1.5"><label className="text-sm font-medium">Peric. %</label><input type="number" step="0.01" disabled={isViewMode} {...register('periculosidade_pct')} className="w-full px-3 py-2 rounded-lg border border-slate-300" /></div>
                                    <div className="space-y-1.5"><label className="text-sm font-medium">Noturno %</label><input type="number" step="0.01" disabled={isViewMode} {...register('adicional_noturno_pct')} className="w-full px-3 py-2 rounded-lg border border-slate-300" /></div>
                                    <div className="space-y-1.5"><label className="text-sm font-medium">Intra. %</label><input type="number" step="0.01" disabled={isViewMode} {...register('intrajornada_pct')} className="w-full px-3 py-2 rounded-lg border border-slate-300" /></div>
                                    <div className="space-y-1.5"><label className="text-sm font-medium">Outros %</label><input type="number" step="0.01" disabled={isViewMode} {...register('outros_pct')} className="w-full px-3 py-2 rounded-lg border border-slate-300" /></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1">Benefícios (R$)</h4>
                                    <InputMask label="Alim./Dia" mask="currency" disabled={isViewMode} {...register('alimentacao_dia_valor')} />
                                    <InputMask label="Desc. Alim." mask="currency" disabled={isViewMode} {...register('desconto_alimentacao_valor')} />
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider border-b border-blue-100 pb-1">Extras (R$)</h4>
                                    <InputMask label="Diurno" mask="currency" disabled={isViewMode} {...register('servico_extra_diurno_valor')} />
                                    <InputMask label="Noturno" mask="currency" disabled={isViewMode} {...register('servico_extra_noturno_valor')} />
                                </div>
                            </div>
                        </form>
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">Cancelar</button>
                            {!isViewMode && (
                                <button onClick={handleSubmit(onSubmit)} disabled={actionLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
                                    {actionLoading && <span className="animate-spin text-xs">⏳</span>} Salvar Dados
                                </button>
                            )}
                            {isViewMode && <button onClick={() => setModalMode('edit')} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Editar</button>}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal isOpen={showDeleteModal} title="Excluir Cargo" message="O registro será enviado para a lixeira." onConfirm={handleDelete} onCancel={() => setShowDeleteModal(false)} />
        </div>
    );
}
