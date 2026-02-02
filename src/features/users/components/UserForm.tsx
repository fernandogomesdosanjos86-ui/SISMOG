import { useState } from 'react';
import { useUsers, type User } from '../useUsers';
import { Save } from 'lucide-react';
import { useModal } from '../../../context/ModalContext';

interface UserFormProps {
    user?: User; // Optional for edit mode
}

const UserForm: React.FC<UserFormProps> = ({ user }) => {
    const { createUser, updateUser } = useUsers();
    const { closeModal, showFeedback } = useModal();
    const isEditing = !!user;

    const [formData, setFormData] = useState({
        nome: user?.nome || '',
        cpf: user?.cpf || '',
        email: user?.email || '',
        permissao: (user?.permissao || 'Operador') as 'Adm' | 'Gestor' | 'Operador',
        setor: user?.setor || '' as string,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.nome) newErrors.nome = 'Nome é obrigatório';
        if (!formData.cpf) newErrors.cpf = 'CPF é obrigatório';
        else if (formData.cpf.length !== 11) newErrors.cpf = 'CPF deve ter 11 dígitos';

        if (!formData.email) newErrors.email = 'Email é obrigatório';

        if (formData.permissao === 'Gestor' && !formData.setor) {
            newErrors.setor = 'Setor é obrigatório para Gestores';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const payload = {
            ...formData,
            setor: formData.permissao === 'Gestor' ? (formData.setor as any) : null
        };

        if (isEditing && user) {
            updateUser.mutate({ id: user.id, updates: payload }, {
                onSuccess: () => {
                    showFeedback('success', 'Usuário atualizado com sucesso!');
                    closeModal();
                },
                onError: (error) => {
                    showFeedback('error', `Erro ao atualizar: ${error.message}`);
                }
            });
        } else {
            createUser.mutate(payload, {
                onSuccess: () => {
                    showFeedback('success', 'Usuário criado com sucesso!');
                    closeModal();
                },
                onError: (error) => {
                    showFeedback('error', `Erro ao criar: ${error.message}`);
                }
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                    type="text"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${errors.nome ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.nome}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Digite o nome completo"
                />
                {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
            </div>

            {/* Email */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                    type="email"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    disabled={isEditing} // Email cannot be changed
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* CPF */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF (apenas números)</label>
                <input
                    type="text"
                    maxLength={11}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition font-mono ${errors.cpf ? 'border-red-500' : 'border-gray-300'}`}
                    value={formData.cpf}
                    onChange={e => setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '') })}
                    placeholder="00000000000"
                    disabled={isEditing} // CPF cannot be changed
                />
                {errors.cpf && <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>}
            </div>

            {/* Permissão */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissão</label>
                <div className="flex gap-4">
                    {['Adm', 'Gestor', 'Operador'].map(perm => (
                        <label key={perm} className={`
              flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition
              ${formData.permissao === perm
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }
            `}>
                            <input
                                type="radio"
                                name="permissao"
                                value={perm}
                                checked={formData.permissao === perm}
                                onChange={e => setFormData({ ...formData, permissao: e.target.value as any })}
                                className="sr-only"
                            />
                            <span className="font-medium">{perm}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Setor - Condicional */}
            {formData.permissao === 'Gestor' && (
                <div className="animate-fade-in-down">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Setor <span className="text-red-500">*</span>
                    </label>
                    <select
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition ${errors.setor ? 'border-red-500' : 'border-gray-300'}`}
                        value={formData.setor}
                        onChange={e => setFormData({ ...formData, setor: e.target.value })}
                    >
                        <option value="">Selecione um setor...</option>
                        {['Direção', 'Dep. Pessoal', 'Frota', 'Financeiro', 'Supervisão'].map(setor => (
                            <option key={setor} value={setor}>{setor}</option>
                        ))}
                    </select>
                    {errors.setor && <p className="text-red-500 text-xs mt-1">{errors.setor}</p>}
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={createUser.isPending}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                    <Save size={18} />
                    {createUser.isPending ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Usuário'}
                </button>
            </div>
        </form>
    );
};

export default UserForm;
