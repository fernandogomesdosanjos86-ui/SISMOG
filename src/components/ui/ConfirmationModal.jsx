import { AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';

export default function ConfirmationModal({ isOpen, title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", onConfirm, onCancel, variant = 'danger' }) {
    if (!isOpen) return null;

    const isDanger = variant === 'danger';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onCancel}
            />

            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={clsx(
                            "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                            isDanger ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                        )}>
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                            <p className="mt-2 text-sm text-slate-500">{message}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={clsx(
                            "px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2",
                            isDanger
                                ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                                : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
                        )}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
