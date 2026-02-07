import React from 'react';
import { X } from 'lucide-react';

interface BaseModalProps {
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    onClose: () => void;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BaseModal: React.FC<BaseModalProps> = ({ title, children, footer, onClose, size = 'md' }) => {
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
            <div className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col animate-modal-enter`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 bg-gray-200 text-gray-600 hover:bg-gray-300 rounded-lg transition-colors flex items-center gap-1"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};
