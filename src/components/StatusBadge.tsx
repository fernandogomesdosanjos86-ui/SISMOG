interface StatusBadgeProps {
    active: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
}

/**
 * Global Status Badge component
 * Shows "Ativo" (green) or "Inativo" (red) based on boolean value
 * Usage: <StatusBadge active={user.ativo} />
 * Usage with custom labels: <StatusBadge active={isOpen} activeLabel="Aberto" inactiveLabel="Fechado" />
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({
    active,
    activeLabel = 'Ativo',
    inactiveLabel = 'Inativo'
}) => {
    return (
        <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
      ${active
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }
    `}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
            {active ? activeLabel : inactiveLabel}
        </span>
    );
};

export default StatusBadge;
