import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { useModal } from '../context/ModalContext';

const UserSettingsForm: React.FC = () => {
    const { closeModal, showFeedback } = useModal();
    const [loading, setLoading] = useState(false);
    const [passwords, setPasswords] = useState({
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswords(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwords.password !== passwords.confirmPassword) {
            showFeedback('error', 'As senhas não coincidem.');
            return;
        }

        if (passwords.password.length < 6) {
            showFeedback('error', 'A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwords.password
            });

            if (error) throw error;

            showFeedback('success', 'Senha atualizada com sucesso!');
            closeModal();
        } catch (error: any) {
            console.error('Erro ao atualizar senha:', error);
            showFeedback('error', error.message || 'Erro ao atualizar senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                <input
                    type="password"
                    name="password"
                    value={passwords.password}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    placeholder="Mínimo 6 caracteres"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Confirmar Senha</label>
                <input
                    type="password"
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    placeholder="Repita a nova senha"
                />
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Salvando...' : 'Atualizar Senha'}
                </button>
            </div>
        </form>
    );
};

export default UserSettingsForm;
