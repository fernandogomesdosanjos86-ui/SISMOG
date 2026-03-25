import React, { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../../../context/ModalContext';
import { useTrocasPlantao } from '../hooks/useTrocasPlantao';
import TrocaPlantaoDetails from './TrocaPlantaoDetails';
import TrocaPlantaoForm from './TrocaPlantaoForm';
import { Calendar, Building2, User, Clock } from 'lucide-react';

const TrocaStatusB = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
        'Pendente': 'bg-amber-100 text-amber-800',
        'Em Análise': 'bg-blue-100 text-blue-800',
        'Autorizado': 'bg-green-100 text-green-800',
        'Negado': 'bg-red-100 text-red-800',
        'Cancelado': 'bg-gray-100 text-gray-800'
    };
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${colors[status] || colors['Pendente']}`}>{status}</span>;
};

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        const safeDateString = dateString.length === 10 ? dateString + 'T12:00:00' : dateString;
        const parsed = new Date(safeDateString);
        if (isNaN(parsed.getTime())) return '-';
        return parsed.toLocaleDateString('pt-BR');
    } catch {
        return '-';
    }
};

const PortalTrocasList: React.FC = () => {
    const { user } = useAuth();
    const { openViewModal, openConfirmModal, openFormModal } = useModal();
    const { trocas, isLoading, delete: deleteTroca } = useTrocasPlantao({}); // Sem filtros, o RLS foca no usuário logado

    const isOperador = user?.user_metadata?.['permissao'] === 'Operador';
    const isGestor = user?.user_metadata?.['permissao'] === 'Gestor';
    const isAdmin = user?.user_metadata?.['permissao'] === 'Adm';
    const isManagement = isGestor || isAdmin;

    const sortedTrocas = useMemo(() => {
        return [...trocas].sort((a, b) => {
            return new Date(b.data_solicitacao).getTime() - new Date(a.data_solicitacao).getTime();
        });
    }, [trocas]);

    const handleViewDetails = (troca: any) => {
        const isOwner = isOperador && troca.solicitante_id === user?.id;
        const canEdit = ((isOwner && troca.status === 'Pendente' && troca.de_acordo === null) || isManagement);
        const canDelete = isManagement;

        openViewModal(
            'Detalhes da Troca',
            <TrocaPlantaoDetails trocaId={troca.id} />,
            {
                canEdit,
                canDelete,
                onEdit: () => {
                    openFormModal('Editar Solicitação de Troca de Plantão', <TrocaPlantaoForm initialData={troca} />);
                },
                onDelete: () => {
                    openConfirmModal(
                        'Excluir Solicitação', 
                        'Tem certeza que deseja excluir esta solicitação de troca de plantão? Esta ação não pode ser desfeita.', 
                        () => deleteTroca(troca.id)
                    );
                }
            }
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (sortedTrocas.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p>Nenhuma troca de plantão registrada no momento.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {sortedTrocas.map((troca) => (
                <div
                    key={troca.id}
                    onClick={() => handleViewDetails(troca)}
                    className="bg-white border text-left border-gray-200 hover:border-blue-300 rounded-xl p-4 transition-all cursor-pointer shadow-sm group"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                            <h3 className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                                <Building2 size={16} className="text-gray-400" />
                                {troca.posto?.nome}
                            </h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <Clock size={12} />
                                Solicitado por {troca.solicitante?.nome} em {formatDate(troca.data_solicitacao)}
                            </p>
                        </div>
                        <TrocaStatusB status={troca.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                            <div className="bg-red-50 p-2 rounded-lg text-red-600">
                                <Calendar size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{formatDate(troca.data_original)}</span>
                                <span className="text-xs text-blue-600 mt-0.5 line-clamp-1">{troca.funcionario_troca?.nome}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="bg-green-50 p-2 rounded-lg text-green-600">
                                <User size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900">{formatDate(troca.data_reposicao) || '-'}</span>
                                <span className="text-xs text-gray-600 mt-0.5 line-clamp-1">{troca.funcionario?.nome}</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PortalTrocasList;
