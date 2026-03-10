import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight, Lock } from 'lucide-react';
import type { NavItem } from './sidebarNavItems';

interface SidebarNavItemProps {
    item: NavItem;
    isExpanded: boolean;
    isLocked: boolean;
    isActiveParent: boolean;
    onToggle: () => void;
    onClose: () => void;
    badge?: number;
    childrenBadges?: Record<string, number>;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
    item, isExpanded, isLocked, isActiveParent, onToggle, onClose, badge, childrenBadges
}) => {
    const hasChildren = item.children && item.children.length > 0;

    if (!hasChildren) {
        return (
            <NavLink
                to={item.path}
                onClick={onClose}
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
        );
    }

    return (
        <div>
            <button
                onClick={() => !isLocked && onToggle()}
                className={`
                    w-full flex items-center justify-between px-6 py-3 transition-colors duration-200
                    ${isLocked
                        ? 'text-blue-200/30 cursor-not-allowed'
                        : isActiveParent ? 'text-blue-100' : 'text-blue-200/70 hover:bg-white/5 hover:text-white'
                    }
                `}
                title={isLocked ? 'Acesso restrito' : undefined}
            >
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <item.icon size={20} />
                        {!!badge && badge > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                        )}
                    </div>
                    <span className="font-medium">{item.label}</span>
                </div>
                {isLocked ? <Lock size={14} /> : isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            <div className={`overflow-hidden transition-all duration-300 ${!isLocked && isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <ul className="bg-black/10 pb-2">
                    {item.children?.map((child) => (
                        <li key={child.path}>
                            <NavLink
                                to={child.path}
                                onClick={onClose}
                                className={({ isActive }) => `
                                    flex items-center gap-3 pl-12 pr-6 py-2.5 text-sm transition-all duration-200
                                    ${isActive
                                        ? 'text-white font-medium border-l-4 border-blue-400 bg-white/5'
                                        : 'text-blue-200/60 hover:text-white border-l-4 border-transparent'
                                    }
                                `}
                            >
                                <child.icon size={18} />
                                <span className="flex-1">{child.label}</span>
                                {!!childrenBadges?.[child.label] && childrenBadges[child.label] > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center justify-center min-w-[18px]">
                                        {childrenBadges[child.label] > 99 ? '99+' : childrenBadges[child.label]}
                                    </span>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SidebarNavItem;
