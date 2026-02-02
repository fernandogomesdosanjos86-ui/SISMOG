import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';

interface PrimaryButtonProps {
    children: ReactNode;
    onClick?: () => void;
    icon?: ReactNode;
    disabled?: boolean;
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    className?: string;
}

/**
 * Global Primary Button component
 * Usage: <PrimaryButton onClick={handleClick}>Novo Usuário</PrimaryButton>
 * Usage with icon: <PrimaryButton icon={<Plus size={20} />}>Novo</PrimaryButton>
 */
const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    children,
    onClick,
    icon,
    disabled = false,
    type = 'button',
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
}) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm hover:shadow-md',
        secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
        >
            {icon}
            {children}
        </button>
    );
};

// Pre-configured "Add" button with plus icon
export const AddButton: React.FC<Omit<PrimaryButtonProps, 'icon'>> = (props) => (
    <PrimaryButton icon={<Plus size={20} />} {...props} />
);

export default PrimaryButton;
