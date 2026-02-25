import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signIn: (email: string, cpf: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    // Estratégia "Instant Kick": Verifica imediatamente a presença de um token.
    // Se não existir, carregamento começa como false, ejetando instantaneamente para o /login
    const hasToken = () => {
        if (typeof window === 'undefined') return false;
        return Object.keys(localStorage).some(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
    };

    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(hasToken());

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            // Instant Kick (Fail Fast) - Sem token local, aborta consultas de rede inúteis.
            if (!hasToken()) {
                if (mounted) setLoading(false);
                return;
            }

            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                }
            } catch (error) {
                console.error("Validação de Autenticação Falhou:", error);
                await supabase.auth.signOut(); // Limpa estado corrompido
                if (mounted) {
                    setSession(null);
                    setUser(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, cpf: string) => {
        // We use the CPF as the password
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: cpf,
        });
        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    const resetPassword = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/update-password',
        });
        return { error };
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, signIn, signOut, resetPassword }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
