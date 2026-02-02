import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useModal } from '../../context/ModalContext';
import { BaseModal } from './BaseModal';

export const ConfirmModal: React.FC = () => {
    const { modal, closeModal } = useModal();
    const [isLoading, setIsLoading] = React.useState(false);

    if (!modal.isOpen || modal.type !== 'confirm') return null;

    const handleConfirm = async () => {
        if (modal.onConfirm) {
            setIsLoading(true);
            try {
                await modal.onConfirm();
                closeModal();
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <BaseModal
            title={modal.title}
            onClose={closeModal}
            size="sm"
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        onClick={closeModal}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition-colors disabled:opacity-50 font-medium"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? 'Processando...' : 'Confirmar'}
                    </button>
                </div>
            }
        >
            <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                    <AlertTriangle className="text-red-600" size={24} />
                </div>
                <p className="text-gray-600 pt-2">{modal.content}</p>
            </div>
        </BaseModal>
    );
};
