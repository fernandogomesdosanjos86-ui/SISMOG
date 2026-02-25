import { type FC, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFuncionarios } from '../features/rh/hooks/useFuncionarios';
import { usePostos } from '../features/supervisao/hooks/usePostos';
import { useTarefas } from '../features/geral/tarefas/hooks/useTarefas';
import { useFaturamentos } from '../features/financeiro/hooks/useFaturamentos';
import { useNavigate } from 'react-router-dom';
import Calendar from '../components/Calendar';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import CompanyBadge from '../components/CompanyBadge';
import TarefaStatusBadge from '../features/geral/tarefas/components/TarefaStatusBadge';
import { Users, MapPin, ListTodo, AlertTriangle, Clock, FileText } from 'lucide-react';
import { parseISO, isToday, isBefore, startOfDay, format } from 'date-fns';
import type { Tarefa } from '../features/geral/tarefas/types';
import type { Faturamento } from '../features/financeiro/types';
import { APP_ROUTES } from '../config/routes';

const getShortName = (fullName?: string): string => {
    if (!fullName) return 'Desconhecido';
    return fullName.trim().split(' ').slice(0, 2).join(' ');
};

const Dashboard: FC = () => {
    const { user } = useAuth();
    const { funcionarios, isLoading } = useFuncionarios();
    const { postos, isLoading: loadingPostos } = usePostos();
    const { tarefas, isLoading: loadingTarefas } = useTarefas();
    const navigate = useNavigate();

    // Faturamentos for current month
    const currentCompetencia = new Date().toISOString().substring(0, 7) + '-01';
    const { faturamentos } = useFaturamentos(currentCompetencia);

    const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo').length;
    const postosAtivos = postos.filter(p => p.status === 'ativo').length;

    // Tarefas where the current user is a destinatário
    const minhasTarefas = useMemo(() => {
        if (!user?.id) return [];
        return tarefas.filter(t =>
            t.destinatarios?.some(d => d.usuario_id === user.id)
        );
    }, [tarefas, user?.id]);

    const tarefasPendentes = minhasTarefas.filter(t => t.status_tarefa === 'Pendente').length;

    // Tasks due today or overdue
    const tarefasUrgentes = useMemo(() => {
        const today = startOfDay(new Date());
        return minhasTarefas
            .filter(t => {
                if (t.status_tarefa === 'Concluído') return false;
                const dataLimite = startOfDay(parseISO(t.data_limite));
                return isToday(dataLimite) || isBefore(dataLimite, today);
            })
            .sort((a, b) => parseISO(a.data_limite).getTime() - parseISO(b.data_limite).getTime());
    }, [minhasTarefas]);

    // Faturamentos pendentes due today or overdue
    const faturamentosUrgentes = useMemo(() => {
        const today = startOfDay(new Date());
        return faturamentos
            .filter(f => {
                if (f.status !== 'pendente') return false;
                if (!f.data_emissao) return false;
                const dataEmissao = startOfDay(parseISO(f.data_emissao));
                return isToday(dataEmissao) || isBefore(dataEmissao, today);
            })
            .sort((a, b) => parseISO(a.data_emissao!).getTime() - parseISO(b.data_emissao!).getTime());
    }, [faturamentos]);

    return (
        <div className="">
            <header className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                <p className="text-gray-500">Bem-vindo ao SISMOG</p>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Funcionários Ativos"
                    value={isLoading ? '...' : String(funcionariosAtivos)}
                    type="success"
                    icon={Users}
                />
                <StatCard
                    title="Postos Ativos"
                    value={loadingPostos ? '...' : String(postosAtivos)}
                    type="info"
                    icon={MapPin}
                />
                <StatCard
                    title="Tarefas Pendentes"
                    value={loadingTarefas ? '...' : String(tarefasPendentes)}
                    type="warning"
                    icon={ListTodo}
                />
            </div>

            {/* Alerts Grid: Tarefas Urgentes + Faturamentos Urgentes */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Tarefas Urgentes / Vencidas */}
                {tarefasUrgentes.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-red-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-red-50 rounded-lg">
                                    <AlertTriangle size={20} className="text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">Tarefas Vencidas ou para Hoje</h3>
                                    <p className="text-xs text-gray-500">{tarefasUrgentes.length} tarefa(s) que exigem atenção</p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate(APP_ROUTES.GERAL.TAREFAS)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                            >
                                Ver todas →
                            </button>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {tarefasUrgentes.slice(0, 5).map((t: Tarefa) => {
                                const dataLimite = parseISO(t.data_limite);
                                const isOverdue = isBefore(startOfDay(dataLimite), startOfDay(new Date()));

                                return (
                                    <div
                                        key={t.id}
                                        className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => navigate(APP_ROUTES.GERAL.TAREFAS)}
                                    >
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-semibold text-sm text-gray-900 truncate">{t.titulo}</span>
                                                <TarefaStatusBadge status={t.status_tarefa} />
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span>De: {getShortName(t.remetente?.nome)}</span>
                                                <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                                                    <Clock size={12} />
                                                    {isOverdue
                                                        ? `Vencida em ${format(dataLimite, "dd/MM")}`
                                                        : 'Vence hoje'
                                                    }
                                                </span>
                                            </div>
                                        </div>

                                        {t.prioridade === 'Urgente' && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase flex-shrink-0">
                                                Urgente
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {tarefasUrgentes.length > 5 && (
                            <div className="px-5 py-2 border-t border-gray-100 text-center">
                                <button
                                    onClick={() => navigate(APP_ROUTES.GERAL.TAREFAS)}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    +{tarefasUrgentes.length - 5} tarefa(s) mais...
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Faturamentos Pendentes / Vencidos */}
                {faturamentosUrgentes.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-orange-50 flex items-center gap-2">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <FileText size={20} className="text-orange-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-sm">Notas a Faturar Hoje ou Vencidas</h3>
                                <p className="text-xs text-gray-500">{faturamentosUrgentes.length} nota(s) pendente(s)</p>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {faturamentosUrgentes.slice(0, 5).map((f: Faturamento) => {
                                const dataEmissao = parseISO(f.data_emissao!);
                                const isOverdue = isBefore(startOfDay(dataEmissao), startOfDay(new Date()));

                                return (
                                    <div key={f.id} className="px-5 py-3 flex items-center justify-between">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-semibold text-sm text-gray-900 truncate">
                                                    {f.contratos?.nome_posto || '-'}
                                                </span>
                                                <CompanyBadge company={f.contratos?.empresa as any} />
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                                                    <Clock size={12} />
                                                    {isOverdue
                                                        ? `Vencida em ${format(dataEmissao, "dd/MM")}`
                                                        : 'Faturar hoje'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                        <StatusBadge active={false} activeLabel="Emitido" inactiveLabel="Pendente" />
                                    </div>
                                );
                            })}
                        </div>

                        {faturamentosUrgentes.length > 5 && (
                            <div className="px-5 py-2 border-t border-gray-100 text-center text-xs text-gray-500">
                                +{faturamentosUrgentes.length - 5} nota(s) mais...
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-8">
                <Calendar />
            </div>
        </div>
    );
};

export default Dashboard;
