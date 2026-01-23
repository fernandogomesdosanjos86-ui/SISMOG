import { Building2 } from 'lucide-react';
import clsx from 'clsx';
import { getBadgeStyle } from '../../utils/styles';

export default function CompanyBadge({ nomeEmpresa }) {
    if (!nomeEmpresa) return <span className="text-slate-400 text-xs">-</span>;

    return (
        <span
            className={clsx(
                // Estrutura idêntica ao StatusBadge: rounded-full, capitalize, border
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize transition-colors select-none",
                getBadgeStyle(nomeEmpresa)
            )}
        >
            <Building2 className="w-3 h-3 opacity-70" />
            {nomeEmpresa}
        </span>
    );
}
