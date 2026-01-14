import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-xl max-w-2xl w-full border border-red-100">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado.</h1>
                        <p className="text-gray-600 mb-4">O sistema encontrou um erro inesperado e não pôde carregar.</p>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-auto max-h-64 mb-6">
                            <code className="text-sm text-red-500 font-mono whitespace-pre-wrap">
                                {this.state.error && this.state.error.toString()}
                                <br />
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </code>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                        >
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
