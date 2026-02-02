import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

const Login = () => {
    const { signIn, resetPassword } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [cpf, setCpf] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = await signIn(email, cpf);
            if (error) {
                setError('Credenciais inválidas. Verifique seu e-mail e CPF.');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError('Ocorreu um erro ao tentar fazer login.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Por favor, digite seu e-mail para recuperar a senha.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await resetPassword(email);
            if (error) {
                setError('Erro ao enviar e-mail de recuperação: ' + error.message);
            } else {
                alert('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
            }
        } catch (err) {
            setError('Erro ao processar solicitação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0f172a]">
            {/* Dynamic Background */}
            <div className="absolute inset-0" style={{
                background: 'radial-gradient(circle at 50% 50%, #1e3a8a 0%, #0f172a 100%)'
            }}></div>

            {/* Floating Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full mix-blend-overlay filter blur-[100px] animate-blob"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full mix-blend-overlay filter blur-[100px] animate-blob animation-delay-2000"></div>
            <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-blue-400/20 rounded-full mix-blend-overlay filter blur-[80px] animate-blob animation-delay-4000"></div>

            {/* Glass Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-xl bg-white/10 border border-white/20 animate-fade-in-up">

                    {/* Header */}
                    <div className="text-center mb-6 flex flex-col items-center">
                        <img src="/logo.png" alt="SISMOG Logo" className="h-24 w-auto object-contain mb-2 drop-shadow-xl" />
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-md">SISMOG</h1>
                        <p className="text-blue-200 text-xs font-medium tracking-widest uppercase mt-1">Gestão Integrada</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 text-red-100 p-3 rounded-xl text-xs mb-4 text-center border border-red-500/30 backdrop-blur-sm shadow-sm flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-blue-100 text-[10px] font-semibold uppercase tracking-wider ml-1">Email</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 group-focus-within:text-white transition-colors" size={18} />
                                <input
                                    type="email"
                                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-400/50 focus:border-white/30 outline-none transition-all text-white placeholder-blue-300/50 backdrop-blur-sm text-sm"
                                    placeholder="Digite seu Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-blue-100 text-[10px] font-semibold uppercase tracking-wider ml-1">Senha</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-300 group-focus-within:text-white transition-colors" size={18} />
                                <input
                                    type="password"
                                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-blue-400/50 focus:border-white/30 outline-none transition-all text-white placeholder-blue-300/50 backdrop-blur-sm text-sm"
                                    placeholder="Digite sua Senha"
                                    value={cpf}
                                    onChange={(e) => setCpf(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-center text-xs text-blue-200/80 pt-1">
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="hover:text-white transition hover:underline underline-offset-4 decoration-blue-400"
                            >
                                Esqueceu a senha?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="
        w-full 
        bg-gradient-to-r from-blue-600 to-blue-500 
        hover:from-blue-500 hover:to-blue-400 
        text-white py-3 rounded-xl font-bold text-sm
        
        /* Sombra e Efeito de Elevação */
        shadow-[0_10px_20px_-5px_rgba(59,130,246,0.4)]
        hover:shadow-[0_15px_25px_-5px_rgba(59,130,246,0.5)]
        
        /* Transição e Transformação */
        transition-all duration-300 
        transform hover:scale-[1.02] active:scale-[0.98]
        hover:-translate-y-1
        
        /* Detalhes de Borda Interna (Iluminação) */
        border border-white/10
        border-t-white/30 
        
        /* Layout */
        flex items-center justify-center gap-2 
        disabled:opacity-70 disabled:cursor-not-allowed 
        mt-1
    "
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Acessando...</span>
                                </div>
                            ) : (
                                <>
                                    <span>ENTRAR</span>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-[10px] text-blue-200/40 font-mono tracking-wider">
                            &copy; {new Date().getFullYear()} SISMOG – GESTÃO INTEGRADA
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
