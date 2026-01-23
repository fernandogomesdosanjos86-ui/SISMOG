import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

/**
 * Componente de proteção de rotas
 * Redireciona para /login se o usuário não estiver autenticado
 * ou se o status do usuário não for 'ativo'
 */
export default function PrivateRoute({ children }) {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const [userActive, setUserActive] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    setAuthenticated(false);
                    setUserActive(false);
                    setLoading(false);
                    return;
                }

                setAuthenticated(true);

                // Verificar status do usuário na tabela usuarios
                const { data: usuario, error } = await supabase
                    .from('usuarios')
                    .select('status')
                    .eq('id', session.user.id)
                    .single();

                if (error) {
                    console.error('Erro ao verificar status do usuário:', error);
                    setUserActive(false);
                    setErrorMessage('Erro ao verificar permissões. Tente novamente.');
                    await supabase.auth.signOut();
                    setLoading(false);
                    return;
                }

                if (usuario?.status !== 'ativo') {
                    // Usuário não está ativo - fazer logout e redirecionar
                    const mensagens = {
                        'aguardando_aprovacao': 'Sua conta está aguardando aprovação do administrador.',
                        'inativo': 'Sua conta foi desativada. Entre em contato com o administrador.'
                    };
                    setErrorMessage(mensagens[usuario?.status] || 'Acesso não autorizado.');
                    setUserActive(false);
                    await supabase.auth.signOut();
                } else {
                    setUserActive(true);
                }
            } catch (err) {
                console.error('Erro na verificação de autenticação:', err);
                setErrorMessage('Erro ao verificar autenticação.');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        // Escutar mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!session) {
                setAuthenticated(false);
                setUserActive(false);
                setLoading(false);
                return;
            }

            setAuthenticated(true);

            // Verificar status do usuário na tabela usuarios
            const { data: usuario } = await supabase
                .from('usuarios')
                .select('status')
                .eq('id', session.user.id)
                .single();

            if (usuario?.status === 'ativo') {
                setUserActive(true);
            } else {
                setUserActive(false);
                await supabase.auth.signOut();
            }

            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-500 text-sm">Verificando autenticação...</span>
                </div>
            </div>
        );
    }

    if (!authenticated || !userActive) {
        // Redireciona para login, salvando a URL atual e mensagem de erro
        return <Navigate to="/login" state={{ from: location, errorMessage }} replace />;
    }

    return children;
}
