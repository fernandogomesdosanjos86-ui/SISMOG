import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { useModal } from '../../context/ModalContext';

export const FeedbackToast: React.FC = () => {
    const { feedback } = useModal();

    if (!feedback.isVisible) return null;

    const config = {
        success: { icon: CheckCircle, bg: 'bg-green-500', iconColor: 'text-white' },
        error: { icon: XCircle, bg: 'bg-red-500', iconColor: 'text-white' },
        warning: { icon: AlertTriangle, bg: 'bg-yellow-500', iconColor: 'text-white' },
        info: { icon: Info, bg: 'bg-blue-500', iconColor: 'text-white' },
    };

    const { icon: Icon, bg } = config[feedback.type];

    return (
        <div className={`fixed bottom-6 right-6 z-[60] ${bg} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up`}>
            <Icon size={24} />
            <span className="font-medium">{feedback.message}</span>
        </div>
    );
};
