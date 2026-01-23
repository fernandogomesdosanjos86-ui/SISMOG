import { useState, useEffect } from 'react';
import { Plus, Building2, Wallet } from 'lucide-react'; // Ícones de Phone e FileText removidos
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';

// --- SERVIÇOS ---
import { empresasService } from '../../services/empresasService'; // Caminho corrigido

// --- INFRAESTRUTURA COMPARTILHADA ---
import { useToast } from '../../components/ui/Toast';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import StatusBadge from '../../components/ui/StatusBadge';
import InputMask from '../../components/ui/InputMask';
import TableActionButtons from '../../components/ui/TableActionButtons';
import TableFilters from '../../components/ui/TableFilters';
import { getBorderColor } from '../../utils/styles';
import { supabase } from '../../lib/supabase';

// --- SCHEMA (Sem CNPJ e Telefone) ---
const empresaSchema = z.object({
    nome_empresa: z.string().min(3, 'Nome obrigatório'),
    regime_tributario: z.string().min(1, 'Selecione o regime'),
    ativo: z.boolean().default(true), // Status ajustado para Boolean
});

export default function Empresas() {
    // --- ESTADOS ---
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modais
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Confirmação
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const { addToast } = useToast();

    // Logo upload
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // --- FORMULÁRIO ---
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(empresaSchema),
        defaultValues: {
            ativo: true,
            regime_tributario: 'Simples Nacional'
        }
    });

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await empresasService.getAll();
            setEmpresas(data || []);
        } catch (error) {
            console.error(error);
            addToast({ type: 'error', title: 'Erro', message: 'Falha ao carregar empresas.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenCreate = () => {
        setModalMode('create');
        setSelectedEmpresa(null);
        setLogoFile(null);
        setLogoPreview(null);
        reset({
            nome_empresa: '',
            regime_tributario: 'Simples Nacional',
            ativo: true
        });
        setShowModal(true);
    };

    const handleOpenView = (empresa) => {
        setModalMode('view');
        setSelectedEmpresa(empresa);
        setLogoFile(null);
        setLogoPreview(empresa.logo || null);

        setValue('nome_empresa', empresa.nome_empresa);
        setValue('regime_tributario', empresa.regime_tributario);
        setValue('ativo', empresa.ativo);

        setShowModal(true);
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                addToast({ type: 'error', title: 'Erro', message: 'Imagem deve ter no máximo 2MB.' });
                return;
            }
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const uploadLogo = async (empresaId) => {
        if (!logoFile) return null;

        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${empresaId}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('empresas')
            .upload(filePath, logoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('empresas')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSwitchToEdit = () => {
        setModalMode('edit');
    };

    const onSubmit = async (data) => {
        try {
            setActionLoading(true);
            const payload = { ...data };

            if (modalMode === 'edit' && selectedEmpresa) {
                // Upload logo se houver novo arquivo
                if (logoFile) {
                    setUploadingLogo(true);
                    const logoUrl = await uploadLogo(selectedEmpresa.id);
                    if (logoUrl) payload.logo = logoUrl;
                    setUploadingLogo(false);
                }
                await empresasService.update(selectedEmpresa.id, payload);
                addToast({ type: 'success', title: 'Sucesso', message: 'Empresa atualizada.' });
            } else {
                // Criar empresa primeiro, depois upload do logo
                const newEmpresa = await empresasService.create(payload);
                if (logoFile && newEmpresa?.id) {
                    setUploadingLogo(true);
                    const logoUrl = await uploadLogo(newEmpresa.id);
                    if (logoUrl) {
                        await empresasService.update(newEmpresa.id, { logo: logoUrl });
                    }
                    setUploadingLogo(false);
                }
                addToast({ type: 'success', title: 'Sucesso', message: 'Empresa cadastrada.' });
            }

            fetchData();
            setShowModal(false);
        } catch (error) {
            console.error('Erro ao salvar empresa:', error);
            addToast({ type: 'error', title: 'Erro', message: error?.message || 'Erro ao salvar dados.' });
        } finally {
            setActionLoading(false);
            setUploadingLogo(false);
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await empresasService.delete(itemToDelete.id);
            setEmpresas(prev => prev.filter(e => e.id !== itemToDelete.id));
            addToast({ type: 'success', title: 'Excluído', message: 'Empresa removida.' });
        } catch (error) {
            addToast({ type: 'error', title: 'Erro', message: 'Não foi possível excluir (verifique vínculos).' });
        } finally {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    // --- FILTROS (Sem busca por CNPJ) ---
    const filteredEmpresas = empresas.filter(e =>
        e.nome_empresa?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isViewMode = modalMode === 'view';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Empresas</h1>
                    <p className="text-slate-500">Gestão de entidades</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    Nova Empresa
                </button>
            </div>

            {/* Busca */}
            <TableFilters
                searchTerm={searchTerm}
                onSearchChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome..."
            />

            {/* Tabela Desktop */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hidden md:block">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Empresa</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Regime</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {loading ? (
                            <tr><td colSpan="4" className="p-8 text-center text-slate-500">Carregando...</td></tr>
                        ) : filteredEmpresas.length === 0 ? (
                            <tr><td colSpan="4" className="p-8 text-center text-slate-500">Nenhuma empresa encontrada.</td></tr>
                        ) : (
                            filteredEmpresas.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => handleOpenView(item)}
                                    className={clsx(
                                        "hover:bg-slate-50 transition-colors cursor-pointer border-l-4",
                                        getBorderColor(item.nome_empresa)
                                    )}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {item.logo ? (
                                                <img src={item.logo} alt={item.nome_empresa} className="h-10 w-10 object-contain" />
                                            ) : (
                                                <div className="h-10 w-10 bg-slate-100 flex items-center justify-center">
                                                    <Building2 className="h-5 w-5 text-slate-400" />
                                                </div>
                                            )}
                                            <span className="font-bold text-slate-900">{item.nome_empresa}</span>
                                        </div>
                                    </td>
                                    {/* Coluna CNPJ/Telefone Removida */}
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                                            {item.regime_tributario}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {/* Status Badge usando boolean direto */}
                                        <StatusBadge value={item.ativo} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <TableActionButtons
                                            onView={() => handleOpenView(item)}
                                            onEdit={() => { handleOpenView(item); handleSwitchToEdit(); }}
                                            onDelete={() => { setItemToDelete(item); setShowDeleteModal(true); }}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Cards Mobile */}
            <div className="md:hidden space-y-4">
                {filteredEmpresas.map(item => (
                    <div
                        key={item.id}
                        onClick={() => handleOpenView(item)}
                        className={clsx(
                            "bg-white p-4 rounded-lg shadow-sm border-l-4 space-y-3 cursor-pointer",
                            getBorderColor(item.nome_empresa)
                        )}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                {item.logo ? (
                                    <img src={item.logo} alt={item.nome_empresa} className="h-10 w-10 rounded-full object-cover border border-slate-200" />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-slate-500" />
                                    </div>
                                )}
                                <h3 className="font-bold text-slate-900">{item.nome_empresa}</h3>
                            </div>
                            <StatusBadge value={item.ativo} />
                        </div>
                        <div className="text-sm text-slate-500 space-y-1">
                            <p className="flex items-center gap-2"><Wallet className="h-4 w-4" /> {item.regime_tributario}</p>
                        </div>
                        <div className="flex justify-end pt-2 border-t border-slate-100">
                            <TableActionButtons
                                onEdit={() => { handleOpenView(item); handleSwitchToEdit(); }}
                                onDelete={() => { setItemToDelete(item); setShowDeleteModal(true); }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />

                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-900">
                                {modalMode === 'create' ? 'Nova Empresa' : modalMode === 'edit' ? 'Editar Empresa' : 'Detalhes'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="sr-only">Fechar</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-4">
                            {/* Logo Upload */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Logo da Empresa</label>
                                <div className="flex items-center gap-4">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo" className="h-16 w-16 object-contain" />
                                    ) : (
                                        <div className="h-16 w-16 bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                                            <Building2 className="h-8 w-8 text-slate-400" />
                                        </div>
                                    )}
                                    {!isViewMode && (
                                        <div>
                                            <label className="cursor-pointer px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50">
                                                {logoPreview ? 'Alterar' : 'Selecionar'}
                                                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                            </label>
                                            <p className="text-xs text-slate-500 mt-1">PNG, JPG até 2MB</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <InputMask
                                label="Razão Social / Nome"
                                disabled={isViewMode}
                                error={errors.nome_empresa}
                                {...register('nome_empresa')}
                            />

                            {/* Inputs de CNPJ e Telefone removidos */}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Regime Tributário</label>
                                    <select
                                        disabled={isViewMode}
                                        {...register('regime_tributario')}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-300 disabled:bg-slate-50 disabled:text-slate-500"
                                    >
                                        <option value="Simples Nacional">Simples Nacional</option>
                                        <option value="Lucro Presumido">Lucro Presumido</option>
                                        <option value="Lucro Real">Lucro Real</option>
                                    </select>
                                    {errors.regime_tributario && <span className="text-xs text-red-600">{errors.regime_tributario.message}</span>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-700">Status</label>
                                    {/* Select adaptado para Boolean */}
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
                            </div>
                        </form>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                {isViewMode ? 'Fechar' : 'Cancelar'}
                            </button>

                            {isViewMode ? (
                                <button
                                    onClick={handleSwitchToEdit}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                >
                                    Editar
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                >
                                    {actionLoading && <span className="animate-spin">⏳</span>}
                                    Salvar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={showDeleteModal}
                title="Excluir Empresa"
                message="Tem certeza? Verifique se não há funcionários ou postos vinculados antes de excluir."
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
            />
        </div>
    );
}
