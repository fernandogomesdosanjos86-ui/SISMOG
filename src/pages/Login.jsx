import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User, ArrowLeft, CheckCircle } from 'lucide-react';
import logo from '../assets/logo-new.png';

const Login = () => {
    // Modes: 'login', 'register', 'forgot'
    const [authMode, setAuthMode] = useState('login');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nome, setNome] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            if (authMode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/');
            }
            else if (authMode === 'register') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: nome, // Importante para a trigger handle_new_user
                        },
                    },
                });
                if (error) throw error;
                setSuccessMsg('Cadastro realizado! Se o login não for automático, verifique seu email.');
                // Ao voltar para login, limpamos os campos para evitar confusão
                setTimeout(() => toggleMode('login'), 3000);
            }
            else if (authMode === 'forgot') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/reset-password',
                });
                if (error) throw error;
                setSuccessMsg('Instruções de recuperação enviadas para seu email.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = (mode) => {
        setAuthMode(mode);
        setError(null);
        setSuccessMsg(null);

        // CORREÇÃO: Limpar campos para evitar "dados fantasmas" ao trocar de tela
        setEmail('');
        setPassword('');
        setNome('');
    };

    const getTitle = () => {
        if (authMode === 'register') return 'Novo Cadastro';
        if (authMode === 'forgot') return 'Recuperar Senha';
        return 'SISMOG';
    };

    const getSubtitle = () => {
        if (authMode === 'register') return 'Solicite seu acesso ao sistema';
        if (authMode === 'forgot') return 'Informe seu email cadastrado';
        return 'Bem-vindo de volta';
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 bg-[length:200%_200%] animate-gradient-xy">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

            {/* CORREÇÃO VISUAL: p-8 alterado para p-6 para ganhar altura vertical */}
            <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden transition-all duration-300">
                {/* Decorative elements */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500 rounded-full blur-[60px] opacity-40"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500 rounded-full blur-[60px] opacity-40"></div>

                {/* CORREÇÃO VISUAL: mb-8 reduzido para mb-6 */}
                <div className="relative z-10 flex flex-col items-center mb-6">
                    <img
                        src={logo}
                        alt="SISMOG Logo"
                        className="w-24 h-auto mb-4 drop-shadow-2xl"
                        style={{ maxWidth: '100px' }}
                    />
                    <h1 className="text-3xl font-bold text-white tracking-tight text-center">{getTitle()}</h1>
                    <p className="text-blue-100 text-sm mt-2 font-light tracking-wide text-center">{getSubtitle()}</p>
                </div>

                {error && (
                    <div className="relative z-10 bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-xl mb-6 text-sm backdrop-blur-sm flex items-center animate-fadeIn">
                        <span className="mr-2">⚠️</span> {error}
                    </div>
                )}

                {successMsg && (
                    <div className="relative z-10 bg-emerald-500/20 border border-emerald-500/50 text-emerald-100 px-4 py-3 rounded-xl mb-6 text-sm backdrop-blur-sm flex items-center animate-fadeIn">
                        <CheckCircle size={16} className="mr-2" /> {successMsg}
                    </div>
                )}

                {/* CORREÇÃO VISUAL: space-y-5 reduzido para space-y-4 */}
                <form onSubmit={handleAuth} className="relative z-10 space-y-4">

                    {authMode === 'register' && (
                        <div className="group animate-fadeIn">
                            <label className="block text-xs font-medium text-blue-200 mb-1 ml-1 uppercase tracking-wider">Nome Completo</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-300">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    className="w-full pl-10 pr-4 h-12 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-white placeholder-blue-300/50 transition-all group-hover:bg-white/10"
                                    placeholder="Seu nome completo"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="group">
                        <label className="block text-xs font-medium text-blue-200 mb-1 ml-1 uppercase tracking-wider">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-300">
                                <Mail size={18} />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 h-12 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-white placeholder-blue-300/50 transition-all group-hover:bg-white/10"
                                placeholder="seu@email.com"
                                required
                            />
                        </div>
                    </div>

                    {authMode !== 'forgot' && (
                        <div className="group">
                            <label className="block text-xs font-medium text-blue-200 mb-1 ml-1 uppercase tracking-wider">Senha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-300">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 h-12 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-white placeholder-blue-300/50 transition-all group-hover:bg-white/10"
                                    placeholder="••••••••"
                                    required={authMode !== 'forgot'}
                                    minLength={6}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white h-12 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
                    >
                        {loading ? 'Processando...' :
                            authMode === 'login' ? 'Acessar Sistema' :
                                authMode === 'register' ? 'Solicitar Cadastro' : 'Enviar Link de Recuperação'}
                    </button>
                </form>

                <div className="relative z-10 mt-6 space-y-3 text-center">
                    {authMode === 'login' && (
                        <>
                            <div>
                                <button onClick={() => toggleMode('forgot')} className="text-xs text-blue-300 hover:text-white transition-colors">
                                    Esqueceu sua senha?
                                </button>
                            </div>
                            <div className="text-xs text-slate-400">
                                Não tem conta?{' '}
                                <button onClick={() => toggleMode('register')} className="text-blue-300 hover:text-white font-medium transition-colors ml-1">
                                    Cadastre-se
                                </button>
                            </div>
                        </>
                    )}

                    {(authMode === 'register' || authMode === 'forgot') && (
                        <button
                            onClick={() => toggleMode('login')}
                            className="flex items-center justify-center w-full text-xs text-blue-300 hover:text-white transition-colors gap-2"
                        >
                            <ArrowLeft size={12} /> Voltar para Login
                        </button>
                    )}
                </div>
            </div>

            <div className="absolute bottom-4 text-center text-xs text-slate-500 mix-blend-screen opacity-50">
                © 2026 SISMOG - Sistema de Monitoramento e Gestão
            </div>
        </div>
    );
};

export default Login;
