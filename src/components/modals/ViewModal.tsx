import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { BaseModal } from './BaseModal';

export const ViewModal: React.FC = () => {
    const { modal, closeModal, showFeedback } = useModal();

    if (!modal.isOpen || modal.type !== 'view') return null;

    const handleUnauthorized = () => {
        showFeedback('error', 'Você não tem permissão para essa ação');
    };

    return (
        <BaseModal
            title={modal.title}
            onClose={closeModal}
            size="lg"
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        onClick={closeModal}
                        className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition-colors font-medium"
                    >
                        Fechar
                    </button>
                    {modal.extraActions?.map((action, idx) => {
                        const variantClasses = {
                            primary: 'bg-green-600 text-white hover:bg-green-700',
                            secondary: 'bg-gray-600 text-white hover:bg-gray-700',
                            danger: 'bg-red-600 text-white hover:bg-red-700',
                        };
                        const bgClass = action.variant ? variantClasses[action.variant] : variantClasses.primary;
                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    closeModal();
                                    action.onClick();
                                }}
                                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${bgClass}`}
                            >
                                {action.icon}
                                {action.label}
                            </button>
                        );
                    })}
                    {modal.onEdit && (
                        <button
                            onClick={() => {
                                if (modal.actionPermissions?.canEdit === false) {
                                    handleUnauthorized();
                                } else {
                                    closeModal();
                                    modal.onEdit?.();
                                }
                            }}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${modal.actionPermissions?.canEdit === false
                                ? 'bg-blue-300 text-white cursor-not-allowed opacity-70'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                        >
                            <Edit2 size={18} />
                            {modal.editText || 'Editar'}
                        </button>
                    )}
                    {modal.onDelete && (
                        <button
                            onClick={() => {
                                if (modal.actionPermissions?.canDelete === false) {
                                    handleUnauthorized();
                                } else {
                                    modal.onDelete?.();
                                }
                            }}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${modal.actionPermissions?.canDelete === false
                                ? 'bg-red-300 text-white cursor-not-allowed opacity-70'
                                : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                        >
                            <Trash2 size={18} />
                            {modal.deleteText || 'Excluir'}
                        </button>
                    )}
                </div>
            }
        >
            {modal.content}
        </BaseModal>
    );
};
