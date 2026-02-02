import React from 'react';
import { ViewModal } from './ViewModal';
import { FormModal } from './FormModal';
import { ConfirmModal } from './ConfirmModal';
import { FeedbackToast } from './FeedbackToast';

export const GlobalModals: React.FC = () => {
    return (
        <>
            <ViewModal />
            <FormModal />
            <ConfirmModal />
            <FeedbackToast />
        </>
    );
};

export * from './BaseModal';
export * from './ViewModal';
export * from './FormModal';
export * from './ConfirmModal';
export * from './FeedbackToast';
