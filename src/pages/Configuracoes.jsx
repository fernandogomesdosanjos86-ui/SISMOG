import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Save, CheckCircle, AlertCircle, User, Mail, Lock, Key } from 'lucide-react';

const Configuracoes = () => {
    const { user } = useAuth();

    // Estado do perfil
    const [profile, setProfile] = useState({
        id: null,
        nome: '',
        email: ''
    });

    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedbackModal, setFeedbackModal] = useState({ open: false, type: 'success', title: '', message: '' });

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            // Busca dados na tabela pública
            const { data, error } = await supabase
                .from('usuarios')
                .select('id, nome, email')
                .eq('email', user.email)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setProfile(data);
            } else {
                // Fallback silencioso caso não encontre (mas agora deve encontrar)
                setProfile({
                    id: null,
                    nome: user.email.split('@')[0], // Ex: fernando.silva
                    email: user.email
                });
            }
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            setFeedbackModal({ open: true, type: 'error', title: 'Erro', message: 'Falha ao carregar dados do perfil.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Lógica de UPSERT (Atualizar ou Inserir)
            const { data: existingUser } = await supabase
                .from('usuarios')
                .select('id')
                .eq('email', user.email)
                .maybeSingle();

            if (existingUser) {
                // ATUALIZAR (UPDATE)
                const { error } = await supabase
                    .from('usuarios')
                    .update({ nome: profile.nome })
                    .eq('id', existingUser.id);
                if (error) throw error;
            } else {
                // CRIAR (INSERT) - Caso de segurança
                const { error } = await supabase
                    .from('usuarios')
                    .insert([
                        {
                            email: user.email,
                            nome: profile.nome,
                            permissao: 1, // Admin por padrão na criação manual via UI
                            categoria: 'Gestão',
                            ativo: true
                        }
                    ]);
                if (error) throw error;
            }

            // Atualização de Senha (Auth)
            if (passwords.newPassword || passwords.confirmPassword) {
                if (passwords.newPassword !== passwords.confirmPassword) {
                    throw new Error("As senhas não conferem.");
                }
                if (passwords.newPassword.length < 6) {
                    throw new Error("A senha deve ter pelo menos 6 caracteres.");
                }

                const { error: authError } = await supabase.auth.updateUser({
                    password: passwords.newPassword
                });

                if (authError) throw authError;
            }

            setFeedbackModal({
                open: true,
                type: 'success',
                title: 'Sucesso!',
                message: 'Seus dados foram atualizados.'
            });

            setPasswords({ newPassword: '', confirmPassword: '' });

            // Recarrega para confirmar que gravou
            fetchProfile();

        } catch (error) {
            // console.error("❌ Erro ao salvar:", error); // Opcional manter log
            setFeedbackModal({ open: true, type: 'error', title: 'Erro ao Salvar', message: error.message });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="ml-0 md:ml-72 transition-all duration-300 flex-1 p-4 md:p-8 lg:p-12 overflow-x-hidden text-slate-900 relative">
                <div className="max-w-3xl mx-auto space-y-6">

                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Settings className="text-blue-600" /> Minha Conta
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Gerencie seus dados pessoais e segurança.
                        </p>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Editar Perfil</h3>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-8">

                            {/* Seção: Dados Pessoais */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Informações Básicas</h4>

                                {/* Nome (Editable) */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                        <User size={14} /> Nome de Exibição
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={profile.nome}
                                        onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
                                        className="w-full h-12 px-4 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                        placeholder="Seu nome completo"
                                    />
                                </div>

                                {/* Email (Read Only) */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                        <Mail size={14} /> E-mail de Acesso
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            disabled
                                            value={profile.email}
                                            className="w-full h-12 px-4 bg-gray-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
                                        />
                                        <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
                                        O e-mail é seu identificador único e não pode ser alterado.
                                    </p>
                                </div>
                            </div>

                            {/* Seção: Segurança (Senha) */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                                    Segurança e Senha
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                            <Key size={14} /> Nova Senha
                                        </label>
                                        <input
                                            type="password"
                                            value={passwords.newPassword}
                                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                            className="w-full h-12 px-4 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                            <CheckCircle size={14} /> Confirmar Nova Senha
                                        </label>
                                        <input
                                            type="password"
                                            value={passwords.confirmPassword}
                                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                            className={`w-full h-12 px-4 bg-white border rounded-lg text-slate-900 focus:ring-2 outline-none transition-all placeholder:text-slate-300 ${passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'}`}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="pt-6 border-t border-slate-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving || loading}
                                    className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all shadow-lg shadow-blue-500/20 font-medium text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Salvando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            <span>Salvar Alterações</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Feedback Modal */}
                {feedbackModal.open && (
                    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                            <div className="p-6 text-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${feedbackModal.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                    {feedbackModal.type === 'success' ? <CheckCircle className="text-emerald-600" size={32} /> : <AlertCircle className="text-red-600" size={32} />}
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">{feedbackModal.title}</h3>
                                <p className="text-slate-600 text-sm mb-6">{feedbackModal.message}</p>
                                <button
                                    onClick={() => setFeedbackModal({ ...feedbackModal, open: false })}
                                    className={`w-full px-4 py-3 rounded-lg font-medium shadow-lg transition-all text-sm block text-white ${feedbackModal.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}
                                >
                                    Entendido
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Configuracoes;
