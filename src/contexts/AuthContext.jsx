import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // Failsafe timeout to prevent infinite loading
        const timer = setTimeout(() => {
            if (mounted && loading) {
                console.warn("Auth initialization timed out. Forcing app load.");
                setLoading(false);
            }
        }, 3000);

        const initAuth = async () => {
            try {
                // Fetch initial session
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("Error fetching session:", error);
                }

                if (mounted) {
                    setSession(data?.session ?? null);
                    setUser(data?.session?.user ?? null);
                }
            } catch (err) {
                console.error("Unexpected error during auth initialization:", err);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                // Ensure loading is false when auth state changes
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(timer);
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const value = {
        session,
        user,
        signOut,
        loading
    };

    // Render loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    {/* Tailwind Spinner */}
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 text-sm font-medium animate-pulse">Iniciando SISMOG...</p>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
