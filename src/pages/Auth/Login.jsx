import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthProvider';
import { Lock, Mail, User, ArrowLeft, CheckCircle, Phone, CreditCard } from 'lucide-react';
import logo from '../../assets/logo.png';

// Máscaras de input
const maskCPF = (value) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
};

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    // Estados
    const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nome, setNome] = useState('');
    const [cpf, setCpf] = useState('');
    const [telefone, setTelefone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Capturar mensagem de erro e verificar sessão existente
    useEffect(() => {
        // Se já tiver mensagem de erro via state
        if (location.state?.errorMessage) {
            setError(location.state.errorMessage);
            window.history.replaceState({}, document.title);
        }

        // Verificar se já existe sessão ativa para redirecionar
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                navigate('/app', { replace: true });
            }
        };

        checkSession();
    }, [location.state, navigate]);

    // Limpar campos ao trocar de modo
    const toggleMode = (mode) => {
        setAuthMode(mode);
        setError(null);
        setSuccessMsg(null);
        setEmail('');
        setPassword('');
        setNome('');
        setCpf('');
        setTelefone('');
    };

    const { login } = useAuth(); // Usar login do contexto

    // Submit do formulário
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            if (authMode === 'login') {
                // Usar a função de login centralizada
                const { error } = await login(email, password);
                if (error) throw error;
                // Redirecionamento já é tratado pelo login/context, mas aqui reforçamos
                navigate('/app');
            } else if (authMode === 'register') {
                if (password.length < 6) {
                    throw new Error('A senha deve ter no mínimo 6 caracteres');
                }
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: nome,
                            cpf: cpf,
                            telefone: telefone
                        }
                    }
                });
                if (error) throw error;
                setSuccessMsg('Cadastro realizado! Aguarde aprovação do administrador.');
                setTimeout(() => toggleMode('login'), 3000);
            } else if (authMode === 'forgot') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/reset-password'
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

    // Títulos dinâmicos
    const getTitle = () => {
        switch (authMode) {
            case 'register': return 'Novo Cadastro';
            case 'forgot': return 'Recuperar Senha';
            default: return 'SISMOG';
        }
    };

    const getSubtitle = () => {
        switch (authMode) {
            case 'register': return 'Solicite seu acesso ao sistema';
            case 'forgot': return 'Informe seu email cadastrado';
            default: return 'Entre com suas credenciais';
        }
    };

    const getButtonText = () => {
        switch (authMode) {
            case 'register': return 'Solicitar Cadastro';
            case 'forgot': return 'Enviar Link de Recuperação';
            default: return 'Entrar';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
            {/* Overlay com textura */}
            <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNhKSIvPjwvc3ZnPg==')]"></div>

            {/* Círculos decorativos */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500 rounded-full filter blur-[128px] opacity-30"></div>
            <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500 rounded-full filter blur-[128px] opacity-30"></div>

            {/* Card Principal */}
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <img src={logo} alt="SISMOG" className="w-24 h-auto drop-shadow-2xl" />
                    </div>

                    {/* Título */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">{getTitle()}</h1>
                        <p className="text-blue-200/70 text-sm">{getSubtitle()}</p>
                    </div>

                    {/* Mensagem de Erro */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3">
                            <span className="text-lg">⚠️</span>
                            <p className="text-red-100 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Mensagem de Sucesso */}
                    {successMsg && (
                        <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-300" />
                            <p className="text-emerald-100 text-sm">{successMsg}</p>
                        </div>
                    )}

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Campos de Cadastro */}
                        {authMode === 'register' && (
                            <>
                                {/* Nome Completo */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-blue-200 uppercase tracking-wider">
                                        Nome Completo
                                    </label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/70" />
                                        <input
                                            type="text"
                                            value={nome}
                                            onChange={(e) => setNome(e.target.value)}
                                            placeholder="Seu nome completo"
                                            required
                                            className="w-full h-12 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all group-hover:bg-white/10"
                                        />
                                    </div>
                                </div>

                                {/* CPF */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-blue-200 uppercase tracking-wider">
                                        CPF
                                    </label>
                                    <div className="relative group">
                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/70" />
                                        <input
                                            type="text"
                                            value={cpf}
                                            onChange={(e) => setCpf(maskCPF(e.target.value))}
                                            placeholder="000.000.000-00"
                                            required
                                            maxLength={14}
                                            className="w-full h-12 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all group-hover:bg-white/10"
                                        />
                                    </div>
                                </div>

                                {/* Telefone */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-blue-200 uppercase tracking-wider">
                                        Telefone
                                    </label>
                                    <div className="relative group">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/70" />
                                        <input
                                            type="text"
                                            value={telefone}
                                            onChange={(e) => setTelefone(maskPhone(e.target.value))}
                                            placeholder="(00) 00000-0000"
                                            required
                                            maxLength={15}
                                            className="w-full h-12 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all group-hover:bg-white/10"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Email (todos os modos) */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-blue-200 uppercase tracking-wider">
                                Email
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/70" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    required
                                    className="w-full h-12 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all group-hover:bg-white/10"
                                />
                            </div>
                        </div>

                        {/* Senha (login e register) */}
                        {authMode !== 'forgot' && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-blue-200 uppercase tracking-wider">
                                    Senha
                                </label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/70" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={authMode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                                        required
                                        minLength={authMode === 'register' ? 6 : undefined}
                                        className="w-full h-12 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all group-hover:bg-white/10"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Botão Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Aguarde...
                                </span>
                            ) : getButtonText()}
                        </button>
                    </form>

                    {/* Links de navegação */}
                    <div className="mt-6 text-center space-y-3">
                        {authMode === 'login' && (
                            <>
                                <button
                                    onClick={() => toggleMode('forgot')}
                                    className="block w-full text-sm text-blue-300 hover:text-white transition-colors"
                                >
                                    Esqueceu sua senha?
                                </button>
                                <button
                                    onClick={() => toggleMode('register')}
                                    className="block w-full text-sm text-blue-300 hover:text-white transition-colors"
                                >
                                    Não tem conta? <span className="font-medium">Cadastre-se</span>
                                </button>
                            </>
                        )}

                        {(authMode === 'register' || authMode === 'forgot') && (
                            <button
                                onClick={() => toggleMode('login')}
                                className="flex items-center justify-center gap-2 w-full text-sm text-blue-300 hover:text-white transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Voltar para Login
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <p className="absolute bottom-4 text-xs text-slate-500 opacity-50 text-center w-full">
                © 2026 SISMOG - Sistema de Monitoramento e Gestão
            </p>
        </div>
    );
}
