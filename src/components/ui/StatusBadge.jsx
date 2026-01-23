
import clsx from 'clsx';

export default function StatusBadge({ value, trueLabel = "Ativo", falseLabel = "Inativo" }) {
    // Normalização Inteligente: Aceita boolean, string 'Ativo'/'ativo' ou string '1'
    const isActive =
        value === true ||
        value === 'Ativo' ||
        value === 'ativo' ||
        value === 1 ||
        value === '1';

    return (
        <span className={clsx(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize",
            isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-slate-100 text-slate-600 border-slate-200"
        )}>
            <span className={clsx(
                "w-1.5 h-1.5 rounded-full mr-1.5",
                isActive ? "bg-emerald-500" : "bg-slate-400"
            )}></span>
            {isActive ? trueLabel : falseLabel}
        </span>
    );
}
