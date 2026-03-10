import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../context/ModalContext';
import UserSettingsForm from '../UserSettingsForm';

const SidebarUserFooter: React.FC = () => {
    const { user, signOut } = useAuth();
    const { openFormModal } = useModal();

    const handleOpenSettings = () => {
        openFormModal('Configurações de Usuário', <UserSettingsForm />);
    };

    return (
        <div className="p-4 border-t border-white/10 bg-[#172554] flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="overflow-hidden">
                    <p className="text-sm font-semibold truncate text-white max-w-[140px]">
                        {user?.user_metadata?.nome?.split(' ').slice(0, 2).join(' ') || 'Usuário'}
                    </p>
                    <p className="text-xs text-blue-200/70 truncate flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {user?.user_metadata?.permissao || 'Visitante'}
                        {user?.user_metadata?.permissao?.toLowerCase() === 'gestor' && user?.user_metadata?.setor
                            ? ` ${user.user_metadata.setor}`
                            : ''}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={handleOpenSettings}
                    className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Configurações de Usuário"
                >
                    <Settings size={20} />
                </button>
                <button
                    onClick={() => signOut()}
                    className="p-2 text-red-300 hover:text-red-100 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Sair do Sistema"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </div>
    );
};

export default SidebarUserFooter;
