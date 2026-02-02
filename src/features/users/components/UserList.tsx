import { useState } from 'react';
import { useUsers, type User } from '../useUsers';
import { Search, Mail, Shield, Building2 } from 'lucide-react';
import { useModal } from '../../../context/ModalContext';
import { useAuth } from '../../../context/AuthContext';

import { PageHeader, AddButton, ResponsiveTable, StatusBadge } from '../../../components';
import UserForm from './UserForm';

// Component to display user details in the modal
const UserDetails: React.FC<{ user: User }> = ({ user }) => (
    <div className="space-y-6">
        {/* Avatar and Name */}
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.nome.charAt(0).toUpperCase()}
            </div>
            <div>
                <h3 className="text-xl font-semibold text-gray-800">{user.nome}</h3>
                <span className={`inline-block mt-1 px-3 py-1 text-xs rounded-full font-semibold ${user.permissao === 'Adm' ? 'bg-purple-100 text-purple-800' :
                    user.permissao === 'Gestor' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                    }`}>
                    {user.permissao}
                </span>
            </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Mail className="text-gray-400" size={20} />
                <div>
                    <p className="text-xs text-gray-500 uppercase">Email</p>
                    <p className="text-gray-800 font-medium">{user.email}</p>
                </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Shield className="text-gray-400" size={20} />
                <div>
                    <p className="text-xs text-gray-500 uppercase">CPF</p>
                    <p className="text-gray-800 font-medium font-mono">{user.cpf}</p>
                </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Building2 className="text-gray-400" size={20} />
                <div>
                    <p className="text-xs text-gray-500 uppercase">Setor</p>
                    <p className="text-gray-800 font-medium">{user.setor || 'Não definido'}</p>
                </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div>
                    <p className="text-xs text-gray-500 uppercase mb-2">Status</p>
                    <StatusBadge active={user.ativo} />
                </div>
            </div>
        </div>
    </div>
);

// Permission badge component
const PermissionBadge: React.FC<{ permissao: User['permissao'] }> = ({ permissao }) => (
    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${permissao === 'Adm' ? 'bg-purple-100 text-purple-800' :
        permissao === 'Gestor' ? 'bg-orange-100 text-orange-800' :
            'bg-blue-100 text-blue-800'
        }`}>
        {permissao}
    </span>
);



// Mobile Card for User
// Mobile Card for User
// Mobile Card for User
const UserCard: React.FC<{ user: User }> = ({ user }) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between">
            <div>
                <p className="font-semibold text-gray-800">{user.nome}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                    <PermissionBadge permissao={user.permissao} />
                    {user.setor && (
                        <span className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full bg-gray-50">
                            {user.setor}
                        </span>
                    )}
                </div>
            </div>
            <StatusBadge active={user.ativo} />
        </div>
    </div>
);

const UserList = () => {
    const { users, isLoading, error, deleteUser } = useUsers();
    const { openViewModal, openFormModal, openConfirmModal, showFeedback } = useModal();
    const { user: currentUser } = useAuth(); // Get current user
    const [searchTerm, setSearchTerm] = useState('');

    const isAdmin = currentUser?.user_metadata?.permissao === 'Adm';

    const filteredUsers = users?.filter(user =>
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.cpf.includes(searchTerm)
    ) || [];

    const handleRowClick = (user: User) => {
        openViewModal(
            'Detalhes do Usuário',
            <UserDetails user={user} />,
            {
                canEdit: isAdmin,
                canDelete: isAdmin,
                onEdit: () => {
                    openFormModal('Editar Usuário', <UserForm user={user} />);
                },
                onDelete: () => {
                    openConfirmModal(
                        'Confirmar Exclusão',
                        `Tem certeza que deseja excluir o usuário "${user.nome}"? Esta ação não pode ser desfeita e removerá o acesso ao sistema.`,
                        async () => {
                            try {
                                await deleteUser.mutateAsync(user.id);
                                showFeedback('success', `Usuário "${user.nome}" excluído com sucesso!`);
                            } catch (error: any) {
                                showFeedback('error', `Erro ao excluir: ${error.message}`);
                            }
                        }
                    );
                }
            }
        );
    };

    const handleNewUser = () => {
        if (!isAdmin) {
            showFeedback('error', 'Você não tem permissão para essa ação');
            return;
        }
        openFormModal('Novo Usuário', <UserForm />);
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <PageHeader title="Usuários" subtitle="Gestão de Usuários e Permissões" />
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    Carregando usuários...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <PageHeader title="Usuários" subtitle="Gestão de Usuários e Permissões" />
                <div className="bg-white rounded-lg shadow p-8 text-center text-red-500">
                    <p>Erro ao carregar usuários:</p>
                    <p className="text-sm font-mono mt-1">{error.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Usuários"
                subtitle="Gestão de Usuários e Permissões"
                action={
                    <div onClick={!isAdmin ? handleNewUser : undefined} className={!isAdmin ? 'cursor-not-allowed' : ''}>
                        <AddButton
                            onClick={isAdmin ? handleNewUser : undefined}
                            className={!isAdmin ? 'bg-blue-300 hover:bg-blue-300 cursor-not-allowed opacity-70 border-none shadow-none' : ''}
                        >
                            Novo Usuário
                        </AddButton>
                    </div>
                }
            />

            {/* Search Bar */}
            <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nome, email ou CPF..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Responsive Table/Cards */}
            <ResponsiveTable
                data={filteredUsers}
                keyExtractor={(user) => user.id}
                onRowClick={handleRowClick}
                emptyMessage="Nenhum usuário encontrado."
                columns={[
                    {
                        key: 'nome',
                        header: 'Nome',
                        render: (user) => <span className="font-medium text-gray-900">{user.nome}</span>
                    },
                    {
                        key: 'email',
                        header: 'Email',
                        render: (user) => <span className="text-gray-600">{user.email}</span>
                    },
                    {
                        key: 'cpf',
                        header: 'CPF',
                        headerClassName: 'hidden md:table-cell',
                        className: 'hidden md:table-cell', // Hide on mobile if needed, matching ResponsiveTable logic? Actually ResponsiveTable handles responsiveness.
                        render: (user) => <span className="text-gray-600 font-mono text-sm">{user.cpf}</span>
                    },
                    {
                        key: 'permissao',
                        header: 'Permissão',
                        render: (user) => <PermissionBadge permissao={user.permissao} />
                    },
                    {
                        key: 'setor',
                        header: 'Setor',
                        headerClassName: 'hidden lg:table-cell',
                        className: 'hidden lg:table-cell',
                        render: (user) => <span className="text-gray-600">{user.setor || '-'}</span>
                    },
                    {
                        key: 'ativo',
                        header: 'Status',
                        className: 'text-center',
                        render: (user) => <StatusBadge active={user.ativo} />
                    },
                ]}
                renderCard={(user) => <UserCard user={user} />}
            />
        </div>
    );
};

export default UserList;
