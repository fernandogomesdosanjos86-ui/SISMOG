import React, { useState, useMemo } from 'react';
import { useFaturamentos } from './hooks/useFaturamentos';
import {
    LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Calendar, Building2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];

const RelatorioFinanceiro: React.FC = () => {
    // Busca todo o histórico de faturamentos omitindo competencia
    const { faturamentos, isLoading } = useFaturamentos();

    const [postoFilter, setPostoFilter] = useState<{ month: string, year: string }>({ month: 'all', year: 'all' });

    // 1. CHART I: Faturamento por Período (Line Chart)
    const faturamentoPorPeriodo = useMemo(() => {
        const agrupado: Record<string, { SEMOG: number; FEMOG: number }> = {};

        faturamentos.forEach(item => {
            if (!item.competencia) return;
            const dateStr = item.competencia.length === 7 ? `${item.competencia}-01` : item.competencia;
            try {
                const date = new Date(dateStr);
                const key = format(date, 'yyyy-MM');

                const empresa = item.contratos?.empresa || 'SEMOG'; // Default fallback

                if (!agrupado[key]) {
                    agrupado[key] = { SEMOG: 0, FEMOG: 0 };
                }

                if (empresa === 'SEMOG' || empresa === 'FEMOG') {
                    agrupado[key][empresa] += Number(item.valor_bruto || 0);
                }
            } catch (e) {
                console.error("Invalid date", item.competencia);
            }
        });

        return Object.entries(agrupado)
            .sort((a, b) => a[0].localeCompare(b[0])) // Cronologicamente crescente
            .map(([key, valores]) => {
                const [year, month] = key.split('-');
                const periodo = format(new Date(Number(year), Number(month) - 1, 1), 'MMM/yy', { locale: ptBR });
                return { periodo, ...valores };
            });
    }, [faturamentos]);

    // 2. CHART II: Faturamento por Posto (Pie Chart)
    const faturamentoPorPosto = useMemo(() => {
        let dadosFiltrados = faturamentos;

        if (postoFilter.month !== 'all' && postoFilter.year !== 'all') {
            dadosFiltrados = dadosFiltrados.filter(item => {
                if (!item.competencia) return false;
                const [year, month] = item.competencia.split('-');
                return month === postoFilter.month && year === postoFilter.year;
            });
        }

        const agrupado: Record<string, number> = {};

        dadosFiltrados.forEach(item => {
            const posto = item.contratos?.nome_posto || 'Não Informado';
            agrupado[posto] = (agrupado[posto] || 0) + Number(item.valor_bruto || 0);
        });

        return Object.entries(agrupado)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Decrescente para priorizar fatias maiores
    }, [faturamentos, postoFilter]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Relatório Financeiro"
                subtitle="Indicadores e visão geral de faturamentos"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Faturamento por Período */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <TrendingUp size={20} />
                        </div>
                        <h3 className="font-semibold text-gray-800">Faturamento por Período</h3>
                    </div>
                    <div className="flex-1 min-h-0">
                        {faturamentoPorPeriodo.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={faturamentoPorPeriodo} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                                    <YAxis tickFormatter={(val) => `${val}`} tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        formatter={(value: any, name?: string) => [formatCurrency(Number(value)), name || 'Faturamento']}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="SEMOG" name="SEMOG" stroke="#f97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="FEMOG" name="FEMOG" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-500 text-sm">Nenhum dado encontrado para o período.</div>
                        )}
                    </div>
                </div>

                {/* 2. Faturamento por Posto */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Building2 size={20} />
                            </div>
                            <h3 className="font-semibold text-gray-800">Faturamento por Posto</h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                            <Calendar size={14} className="text-gray-500 ml-1" />
                            <select
                                className="bg-transparent border-none text-gray-700 text-sm focus:ring-0 cursor-pointer outline-none"
                                value={postoFilter.month}
                                onChange={(e) => setPostoFilter(prev => ({ ...prev, month: e.target.value }))}
                            >
                                <option value="all">Todos os meses</option>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{format(new Date(2025, i, 1), 'MMMM', { locale: ptBR })}</option>
                                ))}
                            </select>
                            <select
                                className="bg-transparent border-none text-gray-700 text-sm focus:ring-0 cursor-pointer outline-none pl-2 border-l border-gray-300"
                                value={postoFilter.year}
                                onChange={(e) => setPostoFilter(prev => ({ ...prev, year: e.target.value }))}
                            >
                                <option value="all">Todos anos</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        {faturamentoPorPosto.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={faturamentoPorPosto}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {faturamentoPorPosto.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => [formatCurrency(Number(value)), 'Faturamento']}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                    />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-500 text-sm">Nenhum dado encontrado para o filtro.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default RelatorioFinanceiro;
