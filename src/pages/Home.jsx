import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../supabaseClient';
import {
    MoreHorizontal, Users, FileText, ClipboardList,
    MessageSquare, ChevronLeft, ChevronRight, Calendar as CalendarIcon
} from 'lucide-react';

// Componente de Card Simplificado (Sem percentuais)
const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={22} className="text-white" />
            </div>
            <button className="text-slate-400 hover:text-slate-600">
                <MoreHorizontal size={20} />
            </button>
        </div>

        <div className="flex flex-col">
            <span className="text-slate-500 text-sm font-medium mb-1">{title}</span>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        </div>
    </div>
);

const Home = () => {
    const [kpis, setKpis] = useState({
        funcionarios: 0,
        contratos: 0
    });

    // Estado para controlar a data do calendário
    const [currentDate, setCurrentDate] = useState(new Date());

    // Funções de Navegação
    const handlePrevMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + 1);
            return newDate;
        });
    };

    // Formatação do Título (Ex: Janeiro de 2026)
    const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
    const year = currentDate.getFullYear();
    const displayDate = `${monthName} de ${year}`; // Capitalização via CSS

    // Lógica do Grid do Calendário
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Domingo

        const days = [];
        // Preenchimento vazio para dias antes do início do mês
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }
        // Dias reais
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }
        return days;
    };

    const calendarDays = getDaysInMonth(currentDate);
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Verifica se o dia renderizado é "Hoje"
    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const { count: countFunc } = await supabase
                .from('funcionarios')
                .select('*', { count: 'exact', head: true });

            const { count: countContratos } = await supabase
                .from('contratos')
                .select('*', { count: 'exact', head: true })
                .eq('ativo', true);

            setKpis({
                funcionarios: countFunc || 0,
                contratos: countContratos || 0
            });

        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            <Sidebar />
            <div className="ml-0 md:ml-72 transition-all duration-300 flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel de Controle</h1>
                        <p className="text-slate-500 mt-1">Visão geral do sistema e indicadores chave.</p>
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                            Hoje, {new Date().toLocaleDateString('pt-BR')}
                        </span>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        title="Funcionários Ativos"
                        value={kpis.funcionarios}
                        icon={Users}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Contratos Ativos"
                        value={kpis.contratos}
                        icon={FileText}
                        color="bg-emerald-500"
                    />
                    <StatCard
                        title="Tarefas"
                        value="0"
                        icon={ClipboardList}
                        color="bg-amber-500"
                    />
                    <StatCard
                        title="Mensagens"
                        value="0"
                        icon={MessageSquare}
                        color="bg-rose-500"
                    />
                </div>

                {/* Área do Calendário Interativo */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    {/* Calendar Header */}
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                        <h2 className="text-lg font-bold text-slate-800 capitalize flex items-center gap-2">
                            <CalendarIcon className="text-blue-600" size={20} />
                            {displayDate}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 border-b border-slate-100">
                        {weekDays.map(day => (
                            <div key={day} className="py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider bg-gray-50 border-r border-slate-100 last:border-r-0">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 auto-rows-fr bg-slate-50">
                        {calendarDays.map((day, index) => {
                            const isCurrentDay = day && isToday(day);
                            return (
                                <div
                                    key={index}
                                    className={`
                                        min-h-[120px] p-3 border-b border-r border-slate-100 bg-white hover:bg-gray-50 transition-colors relative group
                                        ${!day ? 'bg-gray-50/50' : ''}
                                    `}
                                >
                                    {day && (
                                        <>
                                            <span
                                                className={`
                                                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                                    ${isCurrentDay ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-slate-700'}
                                                `}
                                            >
                                                {day}
                                            </span>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Home;
