import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// Types
interface ModalState {
    isOpen: boolean;
    type: 'view' | 'form' | 'confirm' | null;
    title: string;
    content: ReactNode;
    data?: any;
    onConfirm?: () => void | Promise<void>;
    onEdit?: () => void;
    onDelete?: () => void;
    actionPermissions?: {
        canEdit?: boolean;
        canDelete?: boolean;
    };
    // Enhanced options
    editText?: string;
    deleteText?: string;
    extraActions?: Array<{
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary' | 'danger';
        icon?: ReactNode;
    }>;
}

interface FeedbackState {
    isVisible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
}

interface ModalContextType {
    // View Modal
    openViewModal: (
        title: string,
        content: ReactNode,
        options?: {
            onEdit?: () => void;
            onDelete?: () => void;
            canEdit?: boolean;
            canDelete?: boolean;
            editText?: string;
            deleteText?: string;
            extraActions?: Array<{
                label: string;
                onClick: () => void;
                variant?: 'primary' | 'secondary' | 'danger';
                icon?: ReactNode;
            }>;
        }
    ) => void;
    // Form Modal  
    openFormModal: (title: string, content: ReactNode) => void;
    // Confirm Modal
    openConfirmModal: (title: string, message: string, onConfirm: () => void | Promise<void>) => void;
    // Close
    closeModal: () => void;
    // Feedback
    showFeedback: (type: FeedbackState['type'], message: string) => void;
    // State
    modal: ModalState;
    feedback: FeedbackState;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [modal, setModal] = useState<ModalState>({
        isOpen: false,
        type: null,
        title: '',
        content: null,
    });

    const [feedback, setFeedback] = useState<FeedbackState>({
        isVisible: false,
        type: 'info',
        message: '',
    });

    const openViewModal = useCallback((
        title: string,
        content: ReactNode,
        options?: {
            onEdit?: () => void;
            onDelete?: () => void;
            canEdit?: boolean;
            canDelete?: boolean;
            editText?: string;
            deleteText?: string;
            extraActions?: Array<{
                label: string;
                onClick: () => void;
                variant?: 'primary' | 'secondary' | 'danger';
                icon?: ReactNode;
            }>;
        }
    ) => {
        setModal({
            isOpen: true,
            type: 'view',
            title,
            content,
            onEdit: options?.onEdit,
            onDelete: options?.onDelete,
            editText: options?.editText,
            deleteText: options?.deleteText,
            extraActions: options?.extraActions,
            actionPermissions: {
                canEdit: options?.canEdit ?? true,
                canDelete: options?.canDelete ?? true,
            }
        });
    }, []);

    const openFormModal = useCallback((title: string, content: ReactNode) => {
        setModal({
            isOpen: true,
            type: 'form',
            title,
            content,
        });
    }, []);

    const openConfirmModal = useCallback((
        title: string,
        message: string,
        onConfirm: () => void | Promise<void>
    ) => {
        setModal({
            isOpen: true,
            type: 'confirm',
            title,
            content: message,
            onConfirm,
        });
    }, []);

    const closeModal = useCallback(() => {
        setModal({
            isOpen: false,
            type: null,
            title: '',
            content: null,
        });
    }, []);

    const showFeedback = useCallback((type: FeedbackState['type'], message: string) => {
        setFeedback({ isVisible: true, type, message });
        setTimeout(() => {
            setFeedback(prev => ({ ...prev, isVisible: false }));
        }, 4000);
    }, []);

    return (
        <ModalContext.Provider value={{
            openViewModal,
            openFormModal,
            openConfirmModal,
            closeModal,
            showFeedback,
            modal,
            feedback,
        }}>
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
