import { useContext } from 'react';
import { TarefasNotificationContext } from './TarefasNotificationContext';

export const useTarefasNotification = () => {
    const context = useContext(TarefasNotificationContext);
    if (context === undefined) {
        throw new Error('useTarefasNotification must be used within a TarefasNotificationProvider');
    }
    return context;
};
