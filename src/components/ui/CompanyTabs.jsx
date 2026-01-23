
import clsx from 'clsx';

export default function CompanyTabs({ activeTab, onTabChange, empresas = [] }) {
    return (
        // scrollbar-hide e overflow-x-auto garantem usabilidade no mobile
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 overflow-x-auto scrollbar-hide mb-6 shrink-0">
            <button
                onClick={() => onTabChange('all')}
                className={clsx(
                    "rounded-lg px-4 py-2 text-sm transition-all whitespace-nowrap cursor-pointer font-medium border border-transparent",
                    activeTab === 'all'
                        ? "bg-white text-blue-600 shadow-sm font-bold border-slate-200"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                )}
            >
                Todas
            </button>
            {empresas.map(emp => (
                <button
                    key={emp.id}
                    onClick={() => onTabChange(emp.id)}
                    className={clsx(
                        "rounded-lg px-4 py-2 text-sm transition-all whitespace-nowrap cursor-pointer font-medium border border-transparent",
                        activeTab === emp.id
                            ? "bg-white text-blue-600 shadow-sm font-bold border-slate-200"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    )}
                >
                    {emp.nome_empresa}
                </button>
            ))}
        </div>
    );
}
