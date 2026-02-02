import React from 'react';
import { useModal } from '../../context/ModalContext';
import { BaseModal } from './BaseModal';

export const FormModal: React.FC = () => {
    const { modal, closeModal } = useModal();

    if (!modal.isOpen || modal.type !== 'form') return null;

    return (
        <BaseModal
            title={modal.title}
            onClose={closeModal}
            size="lg"
        >
            {modal.content}
        </BaseModal>
    );
};
