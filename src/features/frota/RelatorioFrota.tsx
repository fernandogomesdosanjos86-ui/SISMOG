import React, { useState, useMemo } from 'react';
import { useAbastecimentos } from './hooks/useAbastecimentos';
import { useMovimentacoes } from './hooks/useMovimentacoes';
import {
    LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Car, Fuel, Zap, Filter, Calendar } from 'lucide-react';
import PageHeader from '../../components/PageHeader';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];

const RelatorioFrota: React.FC = () => {
    // Fetch a large page size to compute all reports client-side for now
    const { abastecimentos, isLoading: loadingAbastecimentos } = useAbastecimentos({ page: 1, pageSize: 10000 });
    const { movimentacoes, isLoading: loadingMovimentacoes } = useMovimentacoes({ page: 1, pageSize: 10000 });

    const [combustivelFilter, setCombustivelFilter] = useState<{ month: string, year: string }>({ month: 'all', year: 'all' });
    const [energiaFilter, setEnergiaFilter] = useState<{ month: string, year: string }>({ month: 'all', year: 'all' });

    const isLoading = loadingAbastecimentos || loadingMovimentacoes;

    // 1. CHART I: Combustível por Período (Abastecimentos) - Line
    const consumoCombustivelPeriodo = useMemo(() => {
        const dadosCombustao = abastecimentos.filter(a => a.frota_veiculos?.tipo === 'Combustão' || !a.frota_veiculos?.tipo);

        const agrupado: Record<string, number> = {};

        dadosCombustao.forEach(item => {
            const date = new Date(item.data);
            const key = format(date, 'yyyy-MM');
            agrupado[key] = (agrupado[key] || 0) + Number(item.valor || 0);
        });

        return Object.entries(agrupado)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, total]) => {
                const [year, month] = key.split('-');
                const periodo = format(new Date(Number(year), Number(month) - 1, 1), 'MMM/yy', { locale: ptBR });
                return { periodo, total };
            });
    }, [abastecimentos]);

    // 2. CHART II: Consumo de Combustível x Veículo (Abastecimentos) - Pie
    const consumoCombustivelVeiculo = useMemo(() => {
        let dadosCombustao = abastecimentos.filter(a => a.frota_veiculos?.tipo === 'Combustão' || !a.frota_veiculos?.tipo);

        if (combustivelFilter.month !== 'all' && combustivelFilter.year !== 'all') {
            dadosCombustao = dadosCombustao.filter(item => {
                const date = new Date(item.data);
                return date.getMonth() + 1 === parseInt(combustivelFilter.month) && date.getFullYear() === parseInt(combustivelFilter.year);
            });
        }

        const agrupado: Record<string, number> = {};

        dadosCombustao.forEach(item => {
            const placa = item.frota_veiculos?.placa || 'Desconhecido';
            agrupado[placa] = (agrupado[placa] || 0) + Number(item.valor || 0);
        });

        return Object.entries(agrupado)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // sort desc
    }, [abastecimentos, combustivelFilter]);

    // 3. CHART III: Energia por Período (Movimentações) - Line
    const consumoEnergiaPeriodo = useMemo(() => {
        const dadosEletrico = movimentacoes.filter(m => {
            const vData = m.veiculo || m.frota_veiculos;
            return vData?.tipo === 'Elétrico' && vData?.abastecimento === true;
        });

        const agrupado: Record<string, number> = {};

        dadosEletrico.forEach(item => {
            const date = new Date(item.data_hora_inicial);
            const key = format(date, 'yyyy-MM');
            agrupado[key] = (agrupado[key] || 0) + Number(item.consumo_kw || 0);
        });

        return Object.entries(agrupado)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([key, kwh]) => {
                const [year, month] = key.split('-');
                const periodo = format(new Date(Number(year), Number(month) - 1, 1), 'MMM/yy', { locale: ptBR });
                return { periodo, kwh };
            });
    }, [movimentacoes]);

    // 4. CHART IV: Eficiência por Condutor (Movimentações) - Table
    const consumoEnergiaCondutor = useMemo(() => {
        let dadosEletrico = movimentacoes.filter(m => {
            const vData = m.veiculo || m.frota_veiculos;
            return vData?.tipo === 'Elétrico' && vData?.abastecimento === true;
        });

        if (energiaFilter.month !== 'all' && energiaFilter.year !== 'all') {
            dadosEletrico = dadosEletrico.filter(item => {
                const date = new Date(item.data_hora_inicial);
                return date.getMonth() + 1 === parseInt(energiaFilter.month) && date.getFullYear() === parseInt(energiaFilter.year);
            });
        }

        const agrupado: Record<string, { kwh: number, km: number }> = {};

        dadosEletrico.forEach(item => {
            const resp = item.responsavel || 'Desconhecido';
            if (!agrupado[resp]) {
                agrupado[resp] = { kwh: 0, km: 0 };
            }
            agrupado[resp].kwh += Number(item.consumo_kw || 0);
            agrupado[resp].km += Number(item.km_rodados || 0);
        });

        return Object.entries(agrupado)
            .map(([responsavel, data]) => ({
                responsavel,
                consumoKwh: Number(data.kwh.toFixed(2)),
                kmRodados: Number(data.km.toFixed(2)),
                eficiencia: data.km > 0 ? Number((data.kwh / data.km).toFixed(4)) : 0 // Consumo / KM
            }))
            .sort((a, b) => a.eficiencia - b.eficiencia);
    }, [movimentacoes, energiaFilter]);


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
                title="Relatório Frota"
                subtitle="Indicadores de consumo de combustível e energia"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* 1. Combustível por Período */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Fuel size={20} />
                        </div>
                        <h3 className="font-semibold text-gray-800">Combustível por Período</h3>
                    </div>
                    <div className="flex-1 min-h-0">
                        {consumoCombustivelPeriodo.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={consumoCombustivelPeriodo} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                                    <YAxis tickFormatter={(val) => `R$ ${val}`} tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        formatter={(value: any) => [formatCurrency(Number(value)), 'Valor']}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="total" name="Valor" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-500 text-sm">Nenhum dado encontrado para o período.</div>
                        )}
                    </div>
                </div>

                {/* 2. Combustível por Veículo */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Car size={20} />
                            </div>
                            <h3 className="font-semibold text-gray-800">Combustível por Veículo</h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                            <Calendar size={14} className="text-gray-500 ml-1" />
                            <select
                                className="bg-transparent border-none text-gray-700 text-sm focus:ring-0 cursor-pointer outline-none"
                                value={combustivelFilter.month}
                                onChange={(e) => setCombustivelFilter(prev => ({ ...prev, month: e.target.value }))}
                            >
                                <option value="all">Todos os meses</option>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{format(new Date(2025, i, 1), 'MMMM', { locale: ptBR })}</option>
                                ))}
                            </select>
                            <select
                                className="bg-transparent border-none text-gray-700 text-sm focus:ring-0 cursor-pointer outline-none pl-2 border-l border-gray-300"
                                value={combustivelFilter.year}
                                onChange={(e) => setCombustivelFilter(prev => ({ ...prev, year: e.target.value }))}
                            >
                                <option value="all">Todos anos</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        {consumoCombustivelVeiculo.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={consumoCombustivelVeiculo}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {consumoCombustivelVeiculo.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => [formatCurrency(Number(value)), 'Consumo']}
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

                {/* 3. Energia por Período */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Zap size={20} />
                        </div>
                        <h3 className="font-semibold text-gray-800">Energia por Período</h3>
                    </div>
                    <div className="flex-1 min-h-0">
                        {consumoEnergiaPeriodo.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={consumoEnergiaPeriodo} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                                    <YAxis tickFormatter={(val) => `${val} kWh`} tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        formatter={(value: any) => [`${Number(value).toFixed(2)} kWh`, 'Consumo']}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="kwh" name="Consumo" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-500 text-sm">Nenhum dado encontrado para veículos elétricos.</div>
                        )}
                    </div>
                </div>

                {/* 4. Eficiência por Condutor */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <Filter size={20} />
                            </div>
                            <h3 className="font-semibold text-gray-800">Eficiência por Condutor</h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                            <Calendar size={14} className="text-gray-500 ml-1" />
                            <select
                                className="bg-transparent border-none text-gray-700 text-sm focus:ring-0 cursor-pointer outline-none"
                                value={energiaFilter.month}
                                onChange={(e) => setEnergiaFilter(prev => ({ ...prev, month: e.target.value }))}
                            >
                                <option value="all">Todos os meses</option>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{format(new Date(2025, i, 1), 'MMMM', { locale: ptBR })}</option>
                                ))}
                            </select>
                            <select
                                className="bg-transparent border-none text-gray-700 text-sm focus:ring-0 cursor-pointer outline-none pl-2 border-l border-gray-300"
                                value={energiaFilter.year}
                                onChange={(e) => setEnergiaFilter(prev => ({ ...prev, year: e.target.value }))}
                            >
                                <option value="all">Todos anos</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {consumoEnergiaCondutor.length > 0 ? (
                            consumoEnergiaCondutor.map((item, idx) => (
                                <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-emerald-200 hover:shadow-md transition-all flex items-center justify-between gap-4 group">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-sm font-bold text-gray-500 shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors">
                                            {idx + 1}º
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-semibold text-gray-800 text-sm truncate" title={item.responsavel}>
                                                {item.responsavel}
                                            </h4>
                                            <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                                                <div className="flex items-center gap-1" title="Consumo">
                                                    <Zap size={14} className="text-emerald-500" />
                                                    <span className="font-medium">{item.consumoKwh}</span> kWh
                                                </div>
                                                <div className="flex items-center gap-1" title="Distância">
                                                    <Car size={14} className="text-blue-500" />
                                                    <span className="font-medium">{item.kmRodados}</span> km
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 bg-white px-3 py-2 rounded-lg border border-gray-100 shadow-sm group-hover:border-emerald-100 group-hover:bg-emerald-50/50 transition-colors">
                                        <div className="text-lg font-bold text-emerald-600 leading-none mb-1">
                                            {item.eficiencia.toFixed(2)}
                                        </div>
                                        <div className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-emerald-500 transition-colors">
                                            km / kWh
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-500 text-sm">Nenhum dado encontrado para o filtro.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default RelatorioFrota;
