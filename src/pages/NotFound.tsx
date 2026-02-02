import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { APP_ROUTES } from '../config/routes';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="text-center max-w-lg">
                <div className="mb-8 relative">
                    <h1 className="text-9xl font-black text-slate-200">404</h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-slate-800 bg-slate-50 px-4">
                            Página não encontrada
                        </span>
                    </div>
                </div>

                <p className="text-slate-600 mb-8 text-lg">
                    Desculpe, a página que você está procurando não existe ou foi movida.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 w-full sm:w-auto bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                        <ArrowLeft size={20} />
                        Voltar
                    </button>

                    <button
                        onClick={() => navigate(APP_ROUTES.HOME)}
                        className="px-6 py-3 w-full sm:w-auto bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-600/20"
                    >
                        <Home size={20} />
                        Ir para o Início
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
