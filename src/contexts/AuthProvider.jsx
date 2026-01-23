
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);

    // 1. Instant Kick Strategy (Fail Fast)
    // Initialize 'loading' based on the synchronous presence of the token in localStorage.
    // This prevents the "Spinner" flash for unauthenticated users.
    const [loading, setLoading] = useState(() => {
        try {
            if (typeof window === 'undefined') return true; // SSR safety

            const keys = Object.keys(localStorage);
            const hasSupabaseToken = keys.some(key =>
                key.startsWith('sb-') && key.endsWith('-auth-token')
            );

            return hasSupabaseToken;
        } catch {
            return true; // Fallback to safe loading
        }
    });

    useEffect(() => {
        let mounted = true;

        async function initializeAuth() {
            // Double check: If we started with loading=false, we don't need to run this
            // unless we want to verify session validity in background (optional but good).
            // But based on "Fail Fast", if no local token, we are done.
            if (!loading) {
                return;
            }

            try {
                // 2. Parallelism (End of Waterfall)
                // Retrieve Session/User and Auth User simultaneously
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
                // Fetch public.usuarios status
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
                console.error('Auth initialization error:', error);
                if (mounted) {
                    setSession(null);
                    setUser(null);
                    await supabase.auth.signOut();
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
            if (mounted) {
                if (newSession) {
                    setSession(newSession);
                    // Logic to re-fetch profile can be added here if needed
                } else {
                    setSession(null);
                    setUser(null);
                    setLoading(false);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []); // Intentionally empty dependency array

    const value = {
        user,
        session,
        loading,
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
