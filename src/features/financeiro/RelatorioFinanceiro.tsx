import React, { useState, useMemo } from 'react';
import { useFaturamentos } from './hooks/useFaturamentos';
import {
    LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Calendar, Building2, DollarSign, BarChart2, CheckCircle } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];

interface KpiValueProps {
    total: number;
    femog: number;
    semog: number;
}

const KpiValue: React.FC<KpiValueProps> = ({ total, femog, semog }) => (
    <div className="space-y-1.5 mt-1">
        <div className="text-xl font-bold text-gray-900 tracking-tight">
            {formatCurrency(total)}
        </div>
        <div className="flex flex-col gap-1 pt-1.5 border-t border-gray-100 text-xs">
            <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Femog:
                </span>
                <span className="font-semibold text-blue-700">{formatCurrency(femog)}</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    Semog:
                </span>
                <span className="font-semibold text-orange-700">{formatCurrency(semog)}</span>
            </div>
        </div>
    </div>
);

const RelatorioFinanceiro: React.FC = () => {
    // Busca todo o histórico de faturamentos omitindo competencia
    const { faturamentos, isLoading } = useFaturamentos();

    // 1. Data atual para defaults
    const now = useMemo(() => new Date(), []);
    const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
    const currentYearStr = String(now.getFullYear());

    // Seletor de mês e ano do gráfico "Faturamento por Posto" com default no mês e ano atual
    const [postoFilter, setPostoFilter] = useState<{ month: string, year: string }>({
        month: currentMonthStr,
        year: currentYearStr
    });

    // Anos disponíveis extraídos dos dados de faturamento
    const availableYears = useMemo(() => {
        const years = new Set<string>();
        years.add(currentYearStr);
        faturamentos.forEach(item => {
            const dateStr = item.competencia || item.data_emissao;
            if (dateStr && dateStr.length >= 4) {
                years.add(dateStr.substring(0, 4));
            }
        });
        return Array.from(years).sort().reverse();
    }, [faturamentos, currentYearStr]);

    // 2. KPIs: Mensal, Trimestral, Semestral, Anual e Total (Total, Femog, Semog)
    const kpis = useMemo(() => {
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1 a 12
        const currentQuarter = Math.ceil(currentMonth / 3); // 1 a 4
        const currentSemester = Math.ceil(currentMonth / 6); // 1 ou 2

        const initKpi = () => ({ total: 0, femog: 0, semog: 0 });

        const mensal = initKpi();
        const trimestral = initKpi();
        const semestral = initKpi();
        const anual = initKpi();
        const total = initKpi();

        const addValue = (kpi: { total: number; femog: number; semog: number }, valor: number, empresa?: string) => {
            kpi.total += valor;
            if (empresa === 'FEMOG') {
                kpi.femog += valor;
            } else if (empresa === 'SEMOG') {
                kpi.semog += valor;
            }
        };

        faturamentos.forEach(item => {
            const valor = Number(item.valor_bruto || 0);
            const empresa = item.contratos?.empresa;

            // Faturamento Total (geral acumulado)
            addValue(total, valor, empresa);

            // Data de referência (competência ou data de emissão)
            const dateStr = item.competencia || item.data_emissao;
            if (!dateStr || dateStr.length < 7) return;

            const itemYear = parseInt(dateStr.substring(0, 4), 10);
            const itemMonth = parseInt(dateStr.substring(5, 7), 10);

            if (isNaN(itemYear) || isNaN(itemMonth)) return;

            // Faturamento Anual (ano atual)
            if (itemYear === currentYear) {
                addValue(anual, valor, empresa);

                // Faturamento Semestral (semestre atual)
                const itemSemester = Math.ceil(itemMonth / 6);
                if (itemSemester === currentSemester) {
                    addValue(semestral, valor, empresa);
                }

                // Faturamento Trimestral (trimestre atual)
                const itemQuarter = Math.ceil(itemMonth / 3);
                if (itemQuarter === currentQuarter) {
                    addValue(trimestral, valor, empresa);
                }

                // Faturamento Mensal (mês atual)
                if (itemMonth === currentMonth) {
                    addValue(mensal, valor, empresa);
                }
            }
        });

        return { mensal, trimestral, semestral, anual, total };
    }, [faturamentos, now]);

    // 3. CHART I: Faturamento por Período (Line Chart)
    const faturamentoPorPeriodo = useMemo(() => {
        const agrupado: Record<string, { SEMOG: number; FEMOG: number }> = {};

        faturamentos.forEach(item => {
            const dateStr = item.competencia || item.data_emissao;
            if (!dateStr) return;
            try {
                const key = dateStr.substring(0, 7); // yyyy-MM
                const empresa = item.contratos?.empresa || 'SEMOG';

                if (!agrupado[key]) {
                    agrupado[key] = { SEMOG: 0, FEMOG: 0 };
                }

                if (empresa === 'SEMOG' || empresa === 'FEMOG') {
                    agrupado[key][empresa] += Number(item.valor_bruto || 0);
                }
            } catch (e) {
                console.error("Invalid date", dateStr);
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

    // 4. CHART II: Faturamento por Posto (Pie Chart)
    const faturamentoPorPosto = useMemo(() => {
        let dadosFiltrados = faturamentos;

        if (postoFilter.month !== 'all' || postoFilter.year !== 'all') {
            dadosFiltrados = dadosFiltrados.filter(item => {
                const dateStr = item.competencia || item.data_emissao;
                if (!dateStr || dateStr.length < 7) return false;
                const month = dateStr.substring(5, 7);
                const year = dateStr.substring(0, 4);

                const matchMonth = postoFilter.month === 'all' || month === postoFilter.month;
                const matchYear = postoFilter.year === 'all' || year === postoFilter.year;

                return matchMonth && matchYear;
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

            {/* KPIs Globais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <StatCard
                    title="Faturamento Mensal"
                    value={<KpiValue total={kpis.mensal.total} femog={kpis.mensal.femog} semog={kpis.mensal.semog} />}
                    type="total"
                    icon={Calendar}
                />
                <StatCard
                    title="Faturamento Trimestral"
                    value={<KpiValue total={kpis.trimestral.total} femog={kpis.trimestral.femog} semog={kpis.trimestral.semog} />}
                    type="info"
                    icon={TrendingUp}
                />
                <StatCard
                    title="Faturamento Semestral"
                    value={<KpiValue total={kpis.semestral.total} femog={kpis.semestral.femog} semog={kpis.semestral.semog} />}
                    type="warning"
                    icon={BarChart2}
                />
                <StatCard
                    title="Faturamento Anual"
                    value={<KpiValue total={kpis.anual.total} femog={kpis.anual.femog} semog={kpis.anual.semog} />}
                    type="success"
                    icon={CheckCircle}
                />
                <StatCard
                    title="Faturamento Total"
                    value={<KpiValue total={kpis.total.total} femog={kpis.total.femog} semog={kpis.total.semog} />}
                    type="total"
                    icon={DollarSign}
                />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Faturamento por Período */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px] sm:h-[450px]">
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
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px] sm:h-[450px]">
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
                                {Array.from({ length: 12 }, (_, i) => {
                                    const mStr = String(i + 1).padStart(2, '0');
                                    const monthName = format(new Date(2026, i, 1), 'MMMM', { locale: ptBR });
                                    return (
                                        <option key={mStr} value={mStr}>
                                            {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                                        </option>
                                    );
                                })}
                            </select>
                            <select
                                className="bg-transparent border-none text-gray-700 text-sm focus:ring-0 cursor-pointer outline-none pl-2 border-l border-gray-300"
                                value={postoFilter.year}
                                onChange={(e) => setPostoFilter(prev => ({ ...prev, year: e.target.value }))}
                            >
                                <option value="all">Todos anos</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[250px] w-full relative">
                        {faturamentoPorPosto.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
                                    <Pie
                                        data={faturamentoPorPosto}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius="45%"
                                        outerRadius="75%"
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {faturamentoPorPosto.map((_, index) => (
                                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => [formatCurrency(Number(value)), 'Faturamento']}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                                    />
                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', lineHeight: '14px', paddingTop: '10px' }} />
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
};

export default RelatorioFinanceiro;
