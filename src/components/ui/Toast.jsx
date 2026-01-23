import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ title, message, type = 'info', duration = 3000 }) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, title, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} {...toast} onRemove={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

function ToastItem({ title, message, type, duration, onRemove }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onRemove]);

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
        error: <AlertCircle className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />
    };

    const borders = {
        success: 'border-l-4 border-l-emerald-500',
        error: 'border-l-4 border-l-red-500',
        info: 'border-l-4 border-l-blue-500'
    };

    return (
        <div className={clsx(
            "pointer-events-auto w-80 bg-white rounded-lg shadow-lg border border-slate-200 p-4 flex items-start gap-3 animate-in slide-in-from-right fade-in duration-300",
            borders[type]
        )}>
            <div className="shrink-0 pt-0.5">{icons[type]}</div>
            <div className="flex-1 min-w-0">
                {title && <h4 className="text-sm font-semibold text-slate-900">{title}</h4>}
                {message && <p className="text-sm text-slate-600 mt-0.5">{message}</p>}
            </div>
            <button
                onClick={onRemove}
                className="text-slate-400 hover:text-slate-600 transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
