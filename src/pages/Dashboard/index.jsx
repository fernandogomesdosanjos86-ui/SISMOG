import { useState, useEffect } from 'react';
import { Users, FileCheck, CheckSquare, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../../lib/supabase';

export default function Dashboard() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [totalColaboradores, setTotalColaboradores] = useState(0);
    const [contratosAtivos, setContratosAtivos] = useState(0);
    const [userName, setUserName] = useState('Usuário');

    const formattedDate = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    // Fetch real data
    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Funcionários ativos
                const { count: funcCount } = await supabase
                    .from('funcionarios')
                    .select('*', { count: 'exact', head: true })
                    .eq('ativo', true)
                    .is('deleted_at', null);
                setTotalColaboradores(funcCount || 0);

                // Contratos ativos
                const { count: contCount } = await supabase
                    .from('contratos')
                    .select('*', { count: 'exact', head: true })
                    .eq('ativo', true)
                    .is('deleted_at', null);
                setContratosAtivos(contCount || 0);
            } catch (error) {
                console.error('Erro ao buscar estatísticas:', error);
            }
        };

        const fetchUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: usuarioData } = await supabase
                    .from('usuarios')
                    .select('nome_completo')
                    .eq('id', authUser.id)
                    .single();

                if (usuarioData?.nome_completo) {
                    setUserName(usuarioData.nome_completo.split(' ')[0]);
                } else if (authUser.user_metadata?.full_name) {
                    setUserName(authUser.user_metadata.full_name.split(' ')[0]);
                }
            }
        };

        fetchStats();
        fetchUser();
    }, []);

    // KPI Data
    const kpis = [
        {
            title: 'Total Colaboradores',
            value: totalColaboradores.toString(),
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            title: 'Contratos Ativos',
            value: contratosAtivos.toString(),
            icon: FileCheck,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            title: 'Tarefas Hoje',
            value: '0',
            badge: null,
            icon: CheckSquare,
            color: 'text-orange-600',
            bg: 'bg-orange-50'
        },
        {
            title: 'Mensagens',
            value: '0',
            icon: MessageSquare,
            color: 'text-purple-600',
            bg: 'bg-purple-50'
        },
    ];

    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Calendar Logic
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const daysInMonth = getDaysInMonth(currentDate);
    const startingDay = getFirstDayOfMonth(currentDate);
    const today = new Date();

    const calendarTitle = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Olá, {userName}
                    </h1>
                    <p className="text-slate-500">Bem-vindo ao SISMOG</p>
                </div>
                <div className="text-sm font-medium text-slate-500 capitalize bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    {formattedDate}
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                    <div
                        key={kpi.title}
                        className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">{kpi.title}</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-2">{kpi.value}</h3>
                                {kpi.badge && (
                                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                                        {kpi.badge}
                                    </span>
                                )}
                            </div>
                            <div className={clsx("p-3 rounded-lg transition-colors", kpi.bg, kpi.color)}>
                                <kpi.icon className="h-6 w-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Planner Grid Calendar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Calendar Header Controls */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-900 capitalize flex items-center gap-2">
                        <span className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <CheckSquare className="h-5 w-5" />
                        </span>
                        {calendarTitle}
                    </h2>

                    <div className="flex gap-1">
                        <button
                            onClick={handlePrevMonth}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={handleNextMonth}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-gray-50">
                    {daysOfWeek.map((day) => (
                        <div
                            key={day}
                            className="py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider border-r border-slate-200 last:border-r-0"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid Body */}
                <div className="grid grid-cols-7 bg-slate-200 gap-px border-b border-slate-200">
                    {/* Using gap-px with bg-slate-200 creates the borders between cells essentially */}

                    {/* Empty slots (Previous Month) */}
                    {[...Array(startingDay)].map((_, i) => (
                        <div key={`empty-${i}`} className="bg-gray-50/50 min-h-[120px]" />
                    ))}

                    {/* Days of Current Month */}
                    {[...Array(daysInMonth)].map((_, i) => {
                        const day = i + 1;
                        const isToday =
                            day === today.getDate() &&
                            currentDate.getMonth() === today.getMonth() &&
                            currentDate.getFullYear() === today.getFullYear();

                        return (
                            <div
                                key={day}
                                className="relative bg-white min-h-[120px] p-3 hover:bg-gray-50 transition-colors group"
                            >
                                {/* Day Number */}
                                <div className={clsx(
                                    "text-sm font-medium mb-1",
                                    isToday
                                        ? "w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-sm"
                                        : "text-slate-700"
                                )}>
                                    {day}
                                </div>

                                {/* Placeholder for future tasks/events */}
                                {isToday && (
                                    <div className="mt-2 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 truncate">
                                        Reunião Equipe
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Fill remaining slots to make grid complete (aesthetic) */}
                    {/* Not strictly required by prompt but good for UI finish. Skipping to keep logic clean as requested. */}
                </div>
            </div>
        </div>
    );
}
