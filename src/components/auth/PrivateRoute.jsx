import { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

/**
 * Componente de proteção de rotas (Ultra Otimizado)
 * Verifica localStorage antes de fazer chamadas de rede
 */

// Cache global para evitar múltiplas verificações durante a mesma sessão
let cachedUserStatus = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Verifica rapidamente se há tokens no localStorage (sem await)
const hasLocalSession = () => {
    try {
        // O Supabase guarda a sessão em uma chave específica no localStorage
        const keys = Object.keys(localStorage);
        const supabaseKey = keys.find(key =>
            key.startsWith('sb-') && key.endsWith('-auth-token')
        );
        if (!supabaseKey) return false;

        const stored = localStorage.getItem(supabaseKey);
        if (!stored) return false;

        const parsed = JSON.parse(stored);
        // Verifica se há um access_token válido
        return !!(parsed?.access_token || parsed?.currentSession?.access_token);
    } catch {
        return false;
    }
};

export default function PrivateRoute({ children }) {
    // Verificação síncrona inicial - se não há sessão local, não precisa esperar
    const [loading, setLoading] = useState(() => hasLocalSession());
    const [authenticated, setAuthenticated] = useState(false);
    const [userActive, setUserActive] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const location = useLocation();
    const checkingRef = useRef(false);

    useEffect(() => {
        // Se já determinamos que não há sessão local, não precisa fazer nada
        if (!hasLocalSession()) {
            setLoading(false);
            setAuthenticated(false);
            setUserActive(false);
            return;
        }

        const checkAuth = async () => {
            if (checkingRef.current) return;
            checkingRef.current = true;

            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    setAuthenticated(false);
                    setUserActive(false);
                    cachedUserStatus = null;
                    setLoading(false);
                    checkingRef.current = false;
                    return;
                }

                setAuthenticated(true);

                // Verificar cache antes de fazer query
                const now = Date.now();
                if (cachedUserStatus && (now - cacheTimestamp) < CACHE_DURATION) {
                    setUserActive(cachedUserStatus === 'ativo');
                    setLoading(false);
                    checkingRef.current = false;
                    return;
                }

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
                    cachedUserStatus = null;
                    setLoading(false);
                    checkingRef.current = false;
                    return;
                }

                // Atualizar cache
                cachedUserStatus = usuario?.status;
                cacheTimestamp = now;

                if (usuario?.status !== 'ativo') {
                    const mensagens = {
                        'aguardando_aprovacao': 'Sua conta está aguardando aprovação do administrador.',
                        'inativo': 'Sua conta foi desativada. Entre em contato com o administrador.'
                    };
                    setErrorMessage(mensagens[usuario?.status] || 'Acesso não autorizado.');
                    setUserActive(false);
                    await supabase.auth.signOut();
                    cachedUserStatus = null;
                } else {
                    setUserActive(true);
                }
            } catch (err) {
                console.error('Erro na verificação de autenticação:', err);
                setErrorMessage('Erro ao verificar autenticação.');
            } finally {
                setLoading(false);
                checkingRef.current = false;
            }
        };

        checkAuth();

        // Escutar mudanças de autenticação
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'TOKEN_REFRESHED') return;

            if (event === 'SIGNED_OUT' || !session) {
                cachedUserStatus = null;
                setAuthenticated(false);
                setUserActive(false);
                setLoading(false);
                return;
            }

            if (event === 'SIGNED_IN') {
                cachedUserStatus = null;
                setAuthenticated(true);

                const { data: usuario } = await supabase
                    .from('usuarios')
                    .select('status')
                    .eq('id', session.user.id)
                    .single();

                cachedUserStatus = usuario?.status;
                cacheTimestamp = Date.now();

                if (usuario?.status === 'ativo') {
                    setUserActive(true);
                } else {
                    setUserActive(false);
                    await supabase.auth.signOut();
                }

                setLoading(false);
            }
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
        return <Navigate to="/login" state={{ from: location, errorMessage }} replace />;
    }

    return children;
}
