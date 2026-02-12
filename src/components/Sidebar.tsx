import { useState, useEffect } from 'react';

import { NavLink, useLocation } from 'react-router-dom';
import { Home, Settings, Users, FileText, BarChart2, LogOut, X, ChevronDown, ChevronRight, DollarSign, Box, Briefcase } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import UserSettingsForm from './UserSettingsForm';
import { APP_ROUTES } from '../config/routes';
import '../index.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const { openFormModal } = useModal();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Configurações': false,
    'Financeiro': true
  });

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOpenSettings = () => {
    openFormModal('Configurações de Usuário', <UserSettingsForm />);
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => {
      const newState: Record<string, boolean> = {};
      // Close all currently tracked menus
      Object.keys(prev).forEach(key => newState[key] = false);
      // If clicking a closed menu, open it. If clicking an open one, leave it closed.
      if (!prev[label]) {
        newState[label] = true;
      }
      return newState;
    });
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: APP_ROUTES.HOME },
    {
      icon: Box,
      label: 'Estoque',
      path: APP_ROUTES.ESTOQUE.ROOT,
      children: [
        { icon: FileText, label: 'Equip. Controlados', path: APP_ROUTES.ESTOQUE.EQUIPAMENTOS }
      ]
    },
    {
      icon: Briefcase,
      label: 'Dep. Pessoal',
      path: APP_ROUTES.RH.ROOT,
      children: [
        { icon: FileText, label: 'Cargos e Salários', path: APP_ROUTES.RH.CARGOS_SALARIOS },
        { icon: Users, label: 'Funcionários', path: APP_ROUTES.RH.FUNCIONARIOS }
      ]
    },
    {
      icon: Users, // Using Users icon temporarily, can change if needed
      label: 'Supervisão',
      path: APP_ROUTES.SUPERVISAO.ROOT,
      children: [
        { icon: FileText, label: 'Gestão de Postos', path: APP_ROUTES.SUPERVISAO.POSTOS },
        { icon: DollarSign, label: 'Serviços Extras', path: APP_ROUTES.SUPERVISAO.SERVICOS_EXTRAS }
      ]
    },
    {
      icon: DollarSign,
      label: 'Financeiro',
      path: APP_ROUTES.FINANCEIRO.ROOT,
      children: [
        { icon: FileText, label: 'Contratos', path: APP_ROUTES.FINANCEIRO.CONTRATOS },
        { icon: BarChart2, label: 'Faturamentos', path: APP_ROUTES.FINANCEIRO.FATURAMENTOS },
        { icon: Users, label: 'Recebimentos', path: APP_ROUTES.FINANCEIRO.RECEBIMENTOS }
      ]
    },
    {
      icon: Settings,
      label: 'Configurações',
      path: '#', // Parent item
      children: [
        { icon: Users, label: 'Usuários', path: APP_ROUTES.USERS },
      ]
    },
    { icon: FileText, label: 'Relatórios', path: APP_ROUTES.REPORTS },
    { icon: BarChart2, label: 'Análises', path: APP_ROUTES.ANALYTICS },
  ];
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-full md:w-64 text-white shadow-xl transform transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:inset-auto flex flex-col h-full
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
        style={{
          background: 'linear-gradient(180deg, #1e3a8a 0%, #0f172a 100%)'
        }}>
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between relative">
          <div className="flex flex-col items-center justify-center w-full">
            <img src="/logo.png" alt="SISMOG Logo" className="h-14 object-contain" />
            <span className="text-xl font-bold tracking-widest mt-1 text-white drop-shadow-sm">SISMOG</span>
          </div>
          {/* Close Button (Mobile Only) */}
          <button
            onClick={onClose}
            className="md:hidden absolute right-4 text-white/70 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 no-scrollbar">

          <ul className="space-y-1">
            {navItems.map((item) => {
              const hasChildren = item.children && item.children.length > 0;
              const isExpanded = expandedMenus[item.label];
              const isActiveParent = hasChildren && item.children?.some(child => location.pathname === child.path);

              return (
                <li key={item.label}>
                  {hasChildren ? (
                    <div>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        className={`
                          w-full flex items-center justify-between px-6 py-3 transition-colors duration-200
                          ${isActiveParent ? 'text-blue-100' : 'text-blue-200/70 hover:bg-white/5 hover:text-white'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={20} />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>

                      {/* Submenu */}
                      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <ul className="bg-black/10 pb-2">
                          {item.children?.map((child) => (
                            <li key={child.path}>
                              <NavLink
                                to={child.path}
                                onClick={() => onClose()}
                                className={({ isActive }) => `
                                  flex items-center gap-3 pl-12 pr-6 py-2.5 text-sm transition-all duration-200
                                  ${isActive
                                    ? 'text-white font-medium border-l-4 border-blue-400 bg-white/5'
                                    : 'text-blue-200/60 hover:text-white border-l-4 border-transparent'
                                  }
                                `}
                              >
                                <child.icon size={18} />
                                <span>{child.label}</span>
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <NavLink
                      to={item.path}
                      onClick={() => onClose()}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-6 py-3 transition-all duration-200
                        ${isActive
                          ? 'bg-white/10 text-white border-l-4 border-blue-400'
                          : 'text-blue-100/70 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                        }
                      `}
                    >
                      <item.icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/10 bg-[#172554] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-white max-w-[140px]">
                {user?.user_metadata?.nome?.split(' ').slice(0, 2).join(' ') || 'Usuário'}
              </p>
              <p className="text-xs text-blue-200/70 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {user?.user_metadata?.permissao || 'Visitante'}
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
      </aside>
    </>
  );
};

export default Sidebar;
