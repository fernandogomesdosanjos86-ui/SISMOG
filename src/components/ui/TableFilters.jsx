import { Search } from 'lucide-react';

export default function TableFilters({
    searchTerm,
    onSearchChange,
    placeholder = "Buscar...",
    children
}) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">

            {/* LADO ESQUERDO: Barra de Busca */}
            <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={onSearchChange}
                />
            </div>

            {/* LADO DIREITO: Filtros Opcionais (Botões, Selects, Datas) */}
            {children && (
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    {children}
                </div>
            )}
        </div>
    );
}
