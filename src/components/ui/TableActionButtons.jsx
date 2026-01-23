
import { Pencil, Trash2, Eye } from 'lucide-react';

export default function TableActionButtons({
    onEdit,
    onDelete,
    onView,
    disabled = false
}) {
    return (
        <div className="flex items-center justify-end gap-2">
            {onView && (
                <button
                    onClick={(e) => { e.stopPropagation(); onView(); }}
                    disabled={disabled}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-95"
                    title="Ver Detalhes"
                >
                    <Eye className="h-4 w-4" />
                </button>
            )}

            {onEdit && (
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    disabled={disabled}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-95"
                    title="Editar"
                >
                    <Pencil className="h-4 w-4" />
                </button>
            )}

            {onDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    disabled={disabled}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                    title="Excluir"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
