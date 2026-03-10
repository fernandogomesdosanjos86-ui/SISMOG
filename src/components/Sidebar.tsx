import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { navItems } from './sidebar/sidebarNavItems';
import SidebarNavItem from './sidebar/SidebarNavItem';
import SidebarUserFooter from './sidebar/SidebarUserFooter';
import { APP_ROUTES } from '../config/routes';
import { useTarefasNotification } from '../features/geral/tarefas/context/TarefasNotificationContext';
import '../index.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const { unreadTaskIds } = useTarefasNotification();
  const unreadTarefasCount = unreadTaskIds.length;

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Configurações': false,
    'Financeiro': true
  });

  // Collapse all menus when Dashboard is selected
  useEffect(() => {
    if (location.pathname === APP_ROUTES.HOME) {
      setExpandedMenus({});
    }
  }, [location.pathname]);

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

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => {
      const newState: Record<string, boolean> = {};
      Object.keys(prev).forEach(key => newState[key] = false);
      if (!prev[label]) {
        newState[label] = true;
      }
      return newState;
    });
  };

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
              const isLocked = item.hasAccess ? !item.hasAccess(user) : false;

              let parentBadge = undefined;
              let childrenBadges: Record<string, number> = {};

              if (item.label === 'Geral' && unreadTarefasCount > 0) {
                if (!isExpanded) {
                  parentBadge = unreadTarefasCount;
                }
                childrenBadges['Tarefas'] = unreadTarefasCount;
              }

              return (
                <li key={item.label}>
                  <SidebarNavItem
                    item={item}
                    isExpanded={!!isExpanded}
                    isLocked={isLocked}
                    isActiveParent={!!isActiveParent}
                    onToggle={() => toggleMenu(item.label)}
                    onClose={onClose}
                    badge={parentBadge}
                    childrenBadges={childrenBadges}
                  />
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Footer */}
        <SidebarUserFooter />
      </aside>
    </>
  );
};

export default Sidebar;
