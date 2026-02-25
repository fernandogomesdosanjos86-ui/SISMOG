import { useState, type FC, type FormEvent } from 'react';

import { useUsers, type User } from '../useUsers';
import { Save } from 'lucide-react';
import { useModal } from '../../../context/ModalContext';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';
import { MaskedInputField } from '../../../components/forms/MaskedInputField';
import PrimaryButton from '../../../components/PrimaryButton';

interface UserFormProps {
    user?: User; // Optional for edit mode
}

const UserForm: FC<UserFormProps> = ({ user }) => {

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

    const handleSubmit = (e: FormEvent) => {

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

    const isSubmitting = createUser.isPending || updateUser.isPending;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
                label="Nome Completo"
                type="text"
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Digite o nome completo"
                error={errors.nome}
            />

            <InputField
                label="Email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                disabled={isEditing}
                error={errors.email}
            />

            <MaskedInputField
                label="CPF (apenas números)"
                mask="999.999.999-99"
                value={formData.cpf}
                onChange={e => setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '') })}
                placeholder="000.000.000-00"
                disabled={isEditing}
                error={errors.cpf}
            />

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

            {formData.permissao === 'Gestor' && (
                <div className="animate-fade-in-down">
                    <SelectField
                        label="Setor"
                        required
                        value={formData.setor}
                        onChange={e => setFormData({ ...formData, setor: e.target.value })}
                        error={errors.setor}
                        options={[
                            { value: 'Direção', label: 'Direção' },
                            { value: 'Dep. Pessoal', label: 'Dep. Pessoal' },
                            { value: 'Frota', label: 'Frota' },
                            { value: 'Financeiro', label: 'Financeiro' },
                            { value: 'Supervisão', label: 'Supervisão' },
                        ]}
                    />
                </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t mt-6">
                <button
                    type="button"
                    onClick={closeModal}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Cancelar
                </button>
                <PrimaryButton
                    type="submit"
                    disabled={isSubmitting}
                    icon={<Save size={18} />}
                    fullWidth
                    className="sm:w-auto"
                >
                    {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Usuário'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default UserForm;
