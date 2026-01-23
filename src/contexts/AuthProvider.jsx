
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const isManualLogin = useRef(false);

    // 1. Instant Kick Strategy (Fail Fast)
    const [loading, setLoading] = useState(() => {
        try {
            if (typeof window === 'undefined') return true;

            const keys = Object.keys(localStorage);
            const hasSupabaseToken = keys.some(key =>
                key.startsWith('sb-') && key.endsWith('-auth-token')
            );

            return hasSupabaseToken;
        } catch {
            return true;
        }
    });

    // Função centralizada de LOGIN para evitar Race Condition
    const login = async (email, password) => {
        try {
            isManualLogin.current = true; // Seta flag para bloquear listener

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            if (data.session && data.user) {
                // Busca perfil manualmente para garantir estado completo
                const { data: profile, error: profileError } = await supabase
                    .from('usuarios')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) throw new Error('Erro ao buscar perfil do usuário');

                if (profile.status !== true && profile.status !== 'ativo') {
                    await supabase.auth.signOut();
                    throw new Error('Usuário inativo ou aguardando aprovação');
                }

                // Atualização Otimista e Síncrona
                setSession(data.session);
                setUser({ ...data.user, ...profile });
                // Loading false garante liberação imediata das rotas
                setLoading(false);

                return { data, error: null };
            }
        } catch (error) {
            isManualLogin.current = false; // Libera listener em caso de erro
            throw error;
        } finally {
            // Delay de segurança para garantir que o redirecionamento ocorra
            // antes do listener tentar sobrescrever algo (embora o flag proteja)
            setTimeout(() => {
                isManualLogin.current = false;
            }, 2000);
        }
    };

    useEffect(() => {
        let mounted = true;

        async function initializeAuth() {
            if (!loading) {
                return;
            }

            try {
                // 2. Parallelism (End of Waterfall)
                const [sessionResult, userResult] = await Promise.all([
                    supabase.auth.getSession(),
                    supabase.auth.getUser()
                ]);

                const currentSession = sessionResult.data.session;
                const currentUser = userResult.data.user;

                if (!currentSession || !currentUser) {
                    throw new Error('No valid session');
                }

                // 3. Business Security Check (User Active?)
                const { data: profile, error: profileError } = await supabase
                    .from('usuarios')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();

                if (profileError || !profile) {
                    console.error("Profile fetch error:", profileError);
                    throw new Error('Profile not found');
                }

                if (profile.status !== true && profile.status !== 'ativo') {
                    throw new Error('User inactive');
                }

                if (mounted) {
                    setSession(currentSession);
                    setUser({ ...currentUser, ...profile });
                }
            } catch (error) {
                // Silently fail session restore
                if (mounted) {
                    setSession(null);
                    setUser(null);
                    if (error.message !== 'No valid session') {
                        await supabase.auth.signOut();
                    }
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        initializeAuth();

        // 4. State Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (!mounted) return;

            // RACE CONDITION FIX:
            // Se for login manual, ignoramos o evento SIGNED_IN do listener
            // para evitar que ele resete o loading ou estado que já configuramos.
            if (isManualLogin.current && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
                return;
            }

            if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setLoading(false);
            } else if (newSession && !isManualLogin.current) {
                // Apenas atualiza sessão se não for login manual
                // Em caso de re-autenticação automática (token refresh)
                setSession(newSession);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const value = {
        user,
        session,
        loading,
        login, // Expose login function
        signOut: () => supabase.auth.signOut(),
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading ? children : (
                /* Centralized Loading Spinner */
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-slate-500 text-sm">Carregando sistema...</span>
                    </div>
                </div>
            )}
        </AuthContext.Provider>
    );
}
