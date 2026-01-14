import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import { Search, AlertTriangle, FileText, Calendar, Building2, User, AlertCircle } from 'lucide-react';

const Penalidades = () => {
    const [penalidades, setPenalidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPenalidades();
    }, []);

    const fetchPenalidades = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('penalidades')
                .select(`
                    *,
                    funcionarios (
                        nome,
                        cargo:cargos_salarios(cargo)
                    ),
                    empresas (nome)
                `)
                .order('data_penalidade', { ascending: false });

            if (error) throw error;
            setPenalidades(data || []);
        } catch (error) {
            console.error('Erro ao buscar penalidades:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredPenalidades = penalidades.filter(p =>
        p.funcionarios?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.empresas?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tipo_penalidade.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="ml-0 md:ml-72 transition-all duration-300 flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden text-slate-900">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="text-red-600" /> Gestão de Penalidades
                            </h1>
                            <p className="text-slate-500 text-sm mt-1">Visão geral de todas as infrações registradas</p>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <div className="relative w-full md:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por funcionário, empresa ou tipo..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm bg-white text-slate-900"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">

                        {/* VIEW MOBILE: CARDS */}
                        <div className="block md:hidden divide-y divide-slate-100">
                            {filteredPenalidades.map(p => (
                                <div key={p.id} className="relative p-4 flex flex-col gap-3 bg-white">
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', backgroundColor: '#ef4444' }}></div> {/* Faixa Vermelha */}
                                    <div className="pl-3 mb-2 flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-slate-800">{p.funcionarios?.nome || 'Funcionário'}</h4>
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded border border-red-100">
                                                {p.tipo_penalidade}
                                            </span>
                                        </div>
                                        {/* Arquivo Download Button for Mobile */}
                                        {p.arquivo_url && (
                                            <a href={p.arquivo_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <FileText size={16} />
                                            </a>
                                        )}
                                    </div>
                                    <div className="pl-3 flex justify-between items-end">
                                        <div>
                                            <span className="block text-slate-400 uppercase text-[10px]">Data</span>
                                            <p className="text-sm text-slate-600">{new Date(p.data_penalidade).toLocaleDateString()}</p>
                                        </div>
                                        {/* Valor (Render only if exists) */}
                                        {p.valor && (
                                            <div className="text-right">
                                                <span className="block text-slate-400 uppercase text-[10px]">Valor</span>
                                                <span className="text-lg font-bold text-red-600">
                                                    {parseFloat(p.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pl-3">
                                        <span className="block text-slate-400 uppercase text-[10px]">Motivo</span>
                                        <p className="text-sm text-slate-600 line-clamp-2">{p.motivo || p.descricao || '-'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* VIEW DESKTOP: TABLE */}
                        <div className="hidden md:block overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="p-4 font-semibold pl-6">Data</th>
                                        <th className="p-4 font-semibold">Funcionário</th>
                                        <th className="p-4 font-semibold">Empresa</th>
                                        <th className="p-4 font-semibold">Infração</th>
                                        <th className="p-4 font-semibold text-center">Arquivo</th>
                                        <th className="p-4 font-semibold">Responsável</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (<tr><td colSpan="6" className="p-8 text-center text-slate-500">Carregando...</td></tr>) :
                                        filteredPenalidades.length === 0 ? (<tr><td colSpan="6" className="p-8 text-center text-slate-500">Nenhuma penalidade encontrada.</td></tr>) :
                                            filteredPenalidades.map(p => (
                                                <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="p-4 pl-6 text-sm text-slate-600">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={14} className="text-slate-400" />
                                                            {new Date(p.data_penalidade).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-slate-900 font-medium">{p.funcionarios?.nome || 'Desconhecido'}</div>
                                                        <div className="text-slate-500 text-xs">{p.funcionarios?.cargo?.cargo || '-'}</div>
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-600">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${p.empresas?.nome.toLowerCase().includes('femog') ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                                            {p.empresas?.nome}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm">
                                                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-100 px-2 py-1 rounded-md text-xs font-medium">
                                                            <AlertCircle size={12} /> {p.tipo_penalidade}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {p.arquivo_url ? (
                                                            <a href={p.arquivo_url} target="_blank" rel="noopener noreferrer" className="inline-flex p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors" title="Ver Documento">
                                                                <FileText size={18} />
                                                            </a>
                                                        ) : (
                                                            <span className="text-slate-300 inline-flex p-2"><FileText size={18} /></span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-sm text-slate-600">
                                                        <div className="flex items-center gap-1"><User size={12} /> {p.responsavel}</div>
                                                    </td>
                                                </tr>
                                            ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Penalidades;
