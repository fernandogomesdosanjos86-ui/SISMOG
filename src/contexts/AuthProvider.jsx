
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function initializeAuth() {
            // 1. Fail Fast: Check for local token first
            const hasLocalToken = !!localStorage.getItem(`sb-${import.meta.env.VITE_SUPABASE_ID || 'token'}-auth-token`) ||
                Object.keys(localStorage).some(key => key.startsWith('sb-') && key.endsWith('-auth-token'));

            if (!hasLocalToken) {
                if (mounted) {
                    setLoading(false);
                    setUser(null);
                    setSession(null);
                }
                return;
            }

            try {
                // 2. Parallel Execution: Get Session + User Data simultaneously
                const [sessionResult, userResult] = await Promise.all([
                    supabase.auth.getSession(),
                    supabase.auth.getUser() // Get user directly from auth first to ensure validity
                ]);

                const currentSession = sessionResult.data.session;
                const currentUser = userResult.data.user;

                if (!currentSession || !currentUser) {
                    throw new Error('No valid session');
                }

                // 3. Get Application Specific User Data (Permissions/Status)
                // Only fetch if we have a valid auth user
                const { data: profile, error: profileError } = await supabase
                    .from('usuarios')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();

                if (profileError || !profile) {
                    console.error("Profile fetch error:", profileError);
                    // Optional: Decide if you want to logout here or just allow auth without profile
                    // For strict apps, logout might be better.
                    throw new Error('Profile not found');
                }

                if (profile.status !== true && profile.status !== 'ativo') { // Check both boolean and string just in case
                    throw new Error('User inactive');
                }

                if (mounted) {
                    setSession(currentSession);
                    setUser({ ...currentUser, ...profile }); // Merge auth user with profile data
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                if (mounted) {
                    setSession(null);
                    setUser(null);
                    // Ensure cleanup on error
                    await supabase.auth.signOut();
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
            // Note: we could optimize this further, but standard handling is usually sufficient here
            // Re-fetching full profile on every change might be expensive, 
            // but ensures data consistency on login/refresh.

            if (mounted) {
                if (newSession) {
                    setSession(newSession);
                    // We could refetch user profile here if needed
                } else {
                    setSession(null);
                    setUser(null);
                    setLoading(false); // Ensure loading stops on logout
                }
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
        signOut: () => supabase.auth.signOut(),
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading ? children : (
                /* Initial Loading State - Centralized */
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
