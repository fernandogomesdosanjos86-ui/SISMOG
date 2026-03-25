import React, { useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../../../context/ModalContext';
import { useTrocasPlantao } from '../hooks/useTrocasPlantao';
import { useFuncionarios } from '../../rh/hooks/useFuncionarios';
import PrimaryButton from '../../../components/PrimaryButton';
import { Calendar, User, UserCheck, ShieldCheck, XCircle, Handshake } from 'lucide-react';

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

interface TrocaPlantaoDetailsProps {
    trocaId: string;
}

const TrocaPlantaoDetails: React.FC<TrocaPlantaoDetailsProps> = ({ trocaId }) => {
    const { user } = useAuth();
    const isOperador = user?.user_metadata?.permissao === 'Operador';
    const isGestor = user?.user_metadata?.permissao === 'Gestor';
    const isAdmin = user?.user_metadata?.permissao === 'Adm';

    const { closeModal, showFeedback, openConfirmModal } = useModal();
    const { trocas, cancelar, aceitarCobertura, aprovarReprovar, isWorking } = useTrocasPlantao();
    const { funcionarios } = useFuncionarios();

    const troca = useMemo(() => trocas.find(t => t.id === trocaId), [trocas, trocaId]);

    const operadorMatchId = useMemo(() => {
        if (!user || !user.user_metadata?.cpf) return null;
        const secureSessionCpf = user.user_metadata.cpf.replace(/\D/g, '');
        return funcionarios.find(f => f.cpf && f.cpf.replace(/\D/g, '') === secureSessionCpf)?.id || null;
    }, [user, funcionarios]);

    if (!troca) return <p className="text-gray-500">Troca não encontrada.</p>;

    // Permission Booleans
    const isOwner = isOperador && troca.solicitante_id === user?.id;
    const isTargetFuncionario = isOperador && troca.funcionario_troca_id === operadorMatchId;
    const isManagement = isGestor || isAdmin;

    const handleAction = (action: string) => {
        const actionsMap: Record<string, { title: string, msg: string, call: () => Promise<void> }> = {
            'cancelar': {
                title: 'Cancelar Solicitação', 
                msg: 'Deseja realmente cancelar esta solicitação de troca?',
                call: () => cancelar(troca.id)
            },
            'aceitar': {
                title: 'Aceitar Cobertura',
                msg: 'Você concorda em cobrir o plantão nas datas especificadas?',
                call: () => aceitarCobertura({ id: troca.id, aceito: true })
            },
            'recusar': {
                title: 'Recusar Cobertura',
                msg: 'Você irá recusar cobrir o plantão. A solicitação será cancelada.',
                call: () => aceitarCobertura({ id: troca.id, aceito: false })
            },
            'aprovar': {
                title: 'Autorizar Troca',
                msg: 'Autorizar formalmente a troca de plantão no sistema?',
                call: () => aprovarReprovar({ id: troca.id, aprovado: true, responsavelId: user!.id })
            },
            'negar': {
                title: 'Negar Troca',
                msg: 'Negar a solicitação de troca de plantão?',
                call: () => aprovarReprovar({ id: troca.id, aprovado: false, responsavelId: user!.id })
            }
        };

        const config = actionsMap[action];
        if (!config) return;

        openConfirmModal(config.title, config.msg, async () => {
            try {
                await config.call();
                showFeedback('success', `Ação "${config.title}" realizada com sucesso.`);
                closeModal();
            } catch (error) {
                console.error(error);
                showFeedback('error', 'Erro ao processar a ação.');
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">Troca de Plantão</h3>
                    <p className="text-sm text-gray-500 mt-1">Posto: <span className="font-semibold text-gray-700">{troca.posto?.nome}</span></p>
                </div>
                <TrocaStatusB status={troca.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex items-start gap-3">
                    <Calendar className="text-red-500 mt-0.5" size={20} />
                    <div>
                        <p className="text-xs text-red-600 font-medium tracking-wide uppercase">Data Original</p>
                        <p className="font-semibold text-red-900 text-sm mt-1">{new Date(troca.data_original + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                        <p className="text-xs text-red-700 mt-1 flex items-center gap-1">
                            <UserCheck size={12} />
                            Substituto: {troca.funcionario_troca?.nome}
                        </p>
                        <p className="text-[10px] text-red-600 font-medium mt-0.5">Acordo: {troca.de_acordo === null ? 'Aguardando' : (troca.de_acordo ? 'Sim' : 'Não')}</p>
                    </div>
                </div>

                <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 flex items-start gap-3">
                    <Calendar className="text-green-500 mt-0.5" size={20} />
                    <div>
                        <p className="text-xs text-green-600 font-medium tracking-wide uppercase">Data da Reposição</p>
                        <p className="font-semibold text-green-900 text-sm mt-1">{new Date(troca.data_reposicao + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                        <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
                            <User size={12} />
                            Funcionário: {troca.funcionario?.nome}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-600 space-y-2">
                <p><span className="font-semibold text-gray-800">Solicitado por:</span> {troca.solicitante?.nome} em {new Date(troca.created_at).toLocaleString('pt-BR')}</p>
                {troca.data_analise && (
                    <p><span className="font-semibold text-gray-800">Analisado por:</span> {troca.responsavel_analise?.nome} em {new Date(troca.data_analise).toLocaleString('pt-BR')}</p>
                )}
            </div>

            {/* Ações Dinâmicas - Linha 1: Contexto / Fluxo do Negócio */}
            <div className="flex flex-wrap justify-end gap-3 pt-6">
                {/* Dono / Solicitante pode cancelar antes de ser autorizado */}
                {((isOwner && ['Pendente', 'Em Análise'].includes(troca.status)) || isManagement) && (
                    <button
                        onClick={() => handleAction('cancelar')}
                        disabled={isWorking}
                        className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-transparent rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <XCircle size={18} /> Cancelar Solicitação
                    </button>
                )}

                {/* Funcionário Alvo pode Aceitar / Recusar (Somente Operador da conta correspondente na fase Pendente) */}
                {isTargetFuncionario && troca.status === 'Pendente' && (
                    <>
                        <button
                            onClick={() => handleAction('recusar')}
                            disabled={isWorking}
                            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <XCircle size={18} /> Recusar Cobertura
                        </button>
                        <PrimaryButton onClick={() => handleAction('aceitar')} disabled={isWorking}>
                            <Handshake size={18} className="mr-2" /> Aceitar Cobertura
                        </PrimaryButton>
                    </>
                )}

                {/* Gestores / Adm podem Aprovar ou Negar */}
                {isManagement && ['Pendente', 'Em Análise'].includes(troca.status) && (
                    <>
                        <button
                            onClick={() => handleAction('negar')}
                            disabled={isWorking}
                            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-transparent rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <XCircle size={18} /> Negar Troca
                        </button>
                        <button
                            onClick={() => handleAction('aprovar')}
                            disabled={isWorking}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <ShieldCheck size={18} /> Autorizar Troca
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default TrocaPlantaoDetails;
