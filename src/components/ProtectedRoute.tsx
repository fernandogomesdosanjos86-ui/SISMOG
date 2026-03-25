import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_ROUTES } from '../config/routes';

const ProtectedRoute = () => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const permissao = (user.user_metadata?.['permissao'] as string)?.toLowerCase() || '';
    const isOperador = permissao === 'operador';
    const isPortalOperador = location.pathname === APP_ROUTES.PORTAL_COLABORADOR;

    // Se é Operador e tenta acessar qualquer coisa que não seja o portal dele
    if (isOperador && !isPortalOperador && location.pathname !== APP_ROUTES.LOGIN) {
        return <Navigate to={APP_ROUTES.PORTAL_COLABORADOR} replace />;
    }

    // Se NÃO é operador e tenta acessar o portal (Administradores não caem no layout mobile de operador)
    if (!isOperador && isPortalOperador) {
        return <Navigate to={APP_ROUTES.HOME} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
