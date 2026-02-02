import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="text-red-600" size={32} />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Ops! Algo deu errado.</h1>
                        <p className="text-gray-600 mb-6">
                            Encontramos um erro inesperado. Tente recarregar a página.
                        </p>

                        {this.state.error && (
                            <div className="bg-slate-100 p-3 rounded-lg text-left text-xs font-mono text-slate-600 mb-6 overflow-auto max-h-32">
                                {this.state.error.toString()}
                            </div>
                        )}

                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform active:scale-95 duration-200"
                        >
                            <RefreshCcw size={18} />
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
