import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Car, Fuel, Zap } from 'lucide-react';
import clsx from 'clsx';

// --- SERVIÇOS & UTILS ---
import { useToast } from '../../components/ui/Toast';
import { veiculosService } from '../../services/veiculosService';
import { empresasService } from '../../services/empresasService';
import { getBorderColor } from '../../utils/styles';

// --- COMPONENTES UI ---
import CompanyTabs from '../../components/ui/CompanyTabs';
import CompanyBadge from '../../components/ui/CompanyBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import TableActionButtons from '../../components/ui/TableActionButtons';
import TableFilters from '../../components/ui/TableFilters';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

// --- SCHEMA DE VALIDAÇÃO ---
const veiculoSchema = z.object({
    empresa_id: z.string().min(1, 'Empresa é obrigatória'),
    marca: z.string().min(2, 'Marca é obrigatória'),
    modelo: z.string().min(2, 'Modelo é obrigatório'),
    ano: z.coerce.number().min(1900, 'Ano inválido').max(new Date().getFullYear() + 1, 'Ano inválido'),
    placa: z.string().min(7, 'Placa inválida').max(8, 'Placa inválida'),
    tipo_veiculo: z.string().min(1, 'Tipo de veículo é obrigatório'),
    abastecimento: z.boolean().default(true),
    ativo: z.boolean().default(true),
});

// --- TIPOS DE VEÍCULO ---
const TIPOS_VEICULO = [
    { value: 'Combustão', label: 'Combustão', icon: Fuel },
    { value: 'Elétrico', label: 'Elétrico', icon: Zap },
];

export default function Veiculos() {
    const { addToast } = useToast();

    const [veiculos, setVeiculos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCompany, setActiveCompany] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [editingVeiculo, setEditingVeiculo] = useState(null);

    // Delete Modal
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [veiculoToDelete, setVeiculoToDelete] = useState(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(veiculoSchema),
        defaultValues: {
            abastecimento: true,
            ativo: true,
        }
    });

    useEffect(() => {
        fetchData();
    }, [activeCompany]);

    async function fetchData() {
        try {
            setLoading(true);
            const [veiculosData, empresasData] = await Promise.all([
                veiculosService.getAll(activeCompany === 'all' ? null : activeCompany),
                empresasService.getAll()
            ]);
            setVeiculos(veiculosData || []);
            setEmpresas(empresasData || []);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            addToast({ type: 'error', title: 'Erro', message: 'Falha ao carregar dados.' });
        } finally {
            setLoading(false);
        }
    }

    // --- HANDLERS ---
    function handleAddNew() {
        setEditingVeiculo(null);
        setIsViewMode(false);
        reset({
            empresa_id: activeCompany !== 'all' ? activeCompany : '',
            marca: '',
            modelo: '',
            ano: new Date().getFullYear(),
            placa: '',
            tipo_veiculo: '',
            abastecimento: true,
            ativo: true,
        });
        setIsModalOpen(true);
    }

    function handleEdit(veiculo) {
        setEditingVeiculo(veiculo);
        setIsViewMode(false);
        reset({
            ...veiculo,
        });
        setIsModalOpen(true);
    }

    function handleView(veiculo) {
        handleEdit(veiculo);
        setIsViewMode(true);
    }

    function handleDeleteClick(veiculo) {
        setVeiculoToDelete(veiculo);
        setDeleteModalOpen(true);
    }

    async function confirmDelete() {
        try {
            if (veiculoToDelete) {
                await veiculosService.delete(veiculoToDelete.id);
                addToast({ type: 'success', title: 'Sucesso', message: 'Veículo excluído.' });
                fetchData();
            }
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: 'Erro ao excluir veículo.' });
        } finally {
            setDeleteModalOpen(false);
            setVeiculoToDelete(null);
        }
    }

    async function onSubmit(data) {
        try {
            if (editingVeiculo) {
                await veiculosService.update(editingVeiculo.id, data);
                addToast({ type: 'success', title: 'Sucesso', message: 'Veículo atualizado.' });
            } else {
                await veiculosService.create(data);
                addToast({ type: 'success', title: 'Sucesso', message: 'Veículo cadastrado.' });
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Erro no onSubmit:', error);
            addToast({ type: 'error', title: 'Erro', message: 'Verifique os dados.' });
        }
    }

    // --- FILTERS & SORTING ---
    const filteredVeiculos = veiculos
        .filter(v =>
            v.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.marca.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => a.modelo.localeCompare(b.modelo));

    // --- HELPERS ---
    const getTipoIcon = (tipo) => {
        const tipoInfo = TIPOS_VEICULO.find(t => t.value === tipo);
        return tipoInfo ? tipoInfo.icon : Car;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Veículos</h1>
                    <p className="text-slate-500">Gestão de veículos da frota</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer active:scale-95 w-full md:w-auto justify-center"
                >
                    <Plus size={20} />
                    Veículo
                </button>
            </div>

            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por modelo, marca ou placa..."
            />

            <CompanyTabs activeTab={activeCompany} onTabChange={setActiveCompany} empresas={empresas} />

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Mobile View (Cards) */}
                <div className="md:hidden space-y-4 p-4">
                    {loading ? (
                        <p className="text-center text-slate-500 py-4">Carregando...</p>
                    ) : filteredVeiculos.length === 0 ? (
                        <p className="text-center text-slate-500 py-4">Nenhum veículo encontrado</p>
                    ) : (
                        filteredVeiculos.map(veiculo => {
                            const TipoIcon = getTipoIcon(veiculo.tipo_veiculo);
                            return (
                                <div
                                    key={veiculo.id}
                                    className={clsx(
                                        "bg-white p-4 rounded-lg shadow-sm border-l-4 space-y-3 cursor-pointer",
                                        getBorderColor(veiculo.empresas?.nome_empresa)
                                    )}
                                    onClick={() => handleView(veiculo)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-900">{veiculo.modelo}</h3>
                                            <p className="text-xs text-slate-500 mt-0.5">{veiculo.marca} • {veiculo.ano}</p>
                                            <p className="text-sm font-medium text-slate-700 mt-1">{veiculo.placa}</p>
                                        </div>
                                        <StatusBadge value={veiculo.ativo} />
                                    </div>

                                    <div className="flex gap-2 items-center flex-wrap">
                                        <CompanyBadge nomeEmpresa={veiculo.empresas?.nome_empresa} />
                                        <span className={clsx(
                                            "px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1",
                                            veiculo.tipo_veiculo === 'Elétrico' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        )}>
                                            <TipoIcon size={12} />
                                            {veiculo.tipo_veiculo}
                                        </span>
                                        {veiculo.abastecimento && (
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                Abastecimento
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex justify-end items-center pt-2 border-t border-slate-100">
                                        <TableActionButtons
                                            onEdit={() => handleEdit(veiculo)}
                                            onDelete={() => handleDeleteClick(veiculo)}
                                            onView={() => handleView(veiculo)}
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Desktop View (Table) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-medium">
                            <tr>
                                <th className="px-6 py-3 uppercase text-xs font-semibold">Veículo</th>
                                <th className="px-6 py-3 uppercase text-xs font-semibold">Empresa</th>
                                <th className="px-6 py-3 uppercase text-xs font-semibold">Tipo</th>
                                <th className="px-6 py-3 uppercase text-xs font-semibold text-center">Abastecimento</th>
                                <th className="px-6 py-3 uppercase text-xs font-semibold text-center">Status</th>
                                <th className="px-6 py-3 uppercase text-xs font-semibold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">Carregando...</td></tr>
                            ) : filteredVeiculos.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">Nenhum veículo encontrado</td></tr>
                            ) : (
                                filteredVeiculos.map((veiculo) => {
                                    const TipoIcon = getTipoIcon(veiculo.tipo_veiculo);
                                    return (
                                        <tr
                                            key={veiculo.id}
                                            onClick={() => handleView(veiculo)}
                                            className={clsx(
                                                "hover:bg-slate-50 transition-colors cursor-pointer border-l-4",
                                                getBorderColor(veiculo.empresas?.nome_empresa)
                                            )}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{veiculo.modelo}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">{veiculo.marca} • {veiculo.ano} • {veiculo.placa}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <CompanyBadge nomeEmpresa={veiculo.empresas?.nome_empresa} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={clsx(
                                                    "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit",
                                                    veiculo.tipo_veiculo === 'Elétrico' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                )}>
                                                    <TipoIcon size={12} />
                                                    {veiculo.tipo_veiculo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <StatusBadge value={veiculo.abastecimento} activeText="Sim" inactiveText="Não" />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <StatusBadge value={veiculo.ativo} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <TableActionButtons
                                                    onEdit={() => handleEdit(veiculo)}
                                                    onDelete={() => handleDeleteClick(veiculo)}
                                                    onView={() => handleView(veiculo)}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal CRUD */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <h2 className="text-lg font-bold text-slate-900">
                                {isViewMode ? 'Detalhes do Veículo' : editingVeiculo ? 'Editar Veículo' : 'Novo Veículo'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="sr-only">Fechar</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Empresa *</label>
                                <select
                                    {...register('empresa_id')}
                                    disabled={isViewMode}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 bg-white"
                                >
                                    <option value="">Selecione...</option>
                                    {empresas.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.nome_empresa}</option>
                                    ))}
                                </select>
                                {errors.empresa_id && <span className="text-xs text-red-500">{errors.empresa_id.message}</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Marca *</label>
                                    <input
                                        type="text"
                                        {...register('marca')}
                                        disabled={isViewMode}
                                        placeholder="Ex: Fiat"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                    />
                                    {errors.marca && <span className="text-xs text-red-500">{errors.marca.message}</span>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Modelo *</label>
                                    <input
                                        type="text"
                                        {...register('modelo')}
                                        disabled={isViewMode}
                                        placeholder="Ex: Strada"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                    />
                                    {errors.modelo && <span className="text-xs text-red-500">{errors.modelo.message}</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Ano *</label>
                                    <input
                                        type="number"
                                        {...register('ano')}
                                        disabled={isViewMode}
                                        placeholder="Ex: 2024"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                                    />
                                    {errors.ano && <span className="text-xs text-red-500">{errors.ano.message}</span>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Placa *</label>
                                    <input
                                        type="text"
                                        {...register('placa')}
                                        disabled={isViewMode}
                                        placeholder="Ex: ABC1D23"
                                        maxLength={8}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 uppercase"
                                    />
                                    {errors.placa && <span className="text-xs text-red-500">{errors.placa.message}</span>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Tipo de Veículo *</label>
                                <select
                                    {...register('tipo_veiculo')}
                                    disabled={isViewMode}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 bg-white"
                                >
                                    <option value="">Selecione...</option>
                                    {TIPOS_VEICULO.map(tipo => (
                                        <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                                    ))}
                                </select>
                                {errors.tipo_veiculo && <span className="text-xs text-red-500">{errors.tipo_veiculo.message}</span>}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <label className="flex items-center gap-2 cursor-pointer w-fit">
                                    <input type="checkbox" {...register('abastecimento')} disabled={isViewMode} className="rounded text-blue-600 focus:ring-blue-500 disabled:text-gray-400" />
                                    <span className="text-sm font-medium text-slate-700">Habilitado para abastecimento</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer w-fit">
                                    <input type="checkbox" {...register('ativo')} disabled={isViewMode} className="rounded text-blue-600 focus:ring-blue-500 disabled:text-gray-400" />
                                    <span className="text-sm font-medium text-slate-700">Veículo Ativo</span>
                                </label>
                            </div>
                        </form>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                {isViewMode ? 'Fechar' : 'Cancelar'}
                            </button>

                            {isViewMode ? (
                                <button
                                    onClick={() => { setIsViewMode(false); }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Editar
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting && <span className="animate-spin text-xs">⏳</span>}
                                    {isSubmitting ? 'Salvando...' : 'Salvar Dados'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onCancel={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Excluir Veículo"
                message={`Tem certeza que deseja excluir o veículo ${veiculoToDelete?.modelo} (${veiculoToDelete?.placa})?`}
            />
        </div>
    );
}
