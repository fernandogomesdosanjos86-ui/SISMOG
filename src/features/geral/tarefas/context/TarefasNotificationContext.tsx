import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../../../../services/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { useModal } from '../../../../context/ModalContext';

interface TarefasNotificationContextType {
    unreadTaskIds: string[];
    markAsRead: (tarefaId: string) => Promise<void>;
    refreshUnread: () => Promise<void>;
}

const TarefasNotificationContext = createContext<TarefasNotificationContextType | undefined>(undefined);

export const TarefasNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { showFeedback } = useModal();
    const [unreadTaskIds, setUnreadTaskIds] = useState<string[]>([]);

    const fetchUnread = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase.rpc('get_unread_tarefas');
            if (error) throw error;
            if (data) {
                // Ensure unique IDs
                setUnreadTaskIds(Array.from(new Set(data.map((r: any) => r.tarefa_id))));
            }
        } catch (error) {
            console.error('Error fetching unread tasks:', error);
        }
    };

    const markAsRead = async (tarefaId: string) => {
        if (!user) return;

        // Optimistically remove from state
        setUnreadTaskIds(prev => prev.filter(id => id !== tarefaId));

        try {
            const { error } = await supabase
                .from('geral_tarefa_leituras')
                .upsert({
                    tarefa_id: tarefaId,
                    usuario_id: user.id,
                    ultima_leitura: new Date().toISOString()
                }, { onConflict: 'tarefa_id,usuario_id' });

            if (error) throw error;
        } catch (error) {
            console.error('Error marking task as read:', error);
            // Revert on error
            fetchUnread();
        }
    };

    // Initial load and Realtime Subscriptions
    useEffect(() => {
        if (!user) {
            setUnreadTaskIds([]);
            return;
        }

        fetchUnread();

        const channel = supabase.channel('tarefas-notifications')
            // Listen to new tasks or status updates
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'geral_tarefas' },
                async (payload) => {
                    const isInsert = payload.eventType === 'INSERT';
                    const isUpdate = payload.eventType === 'UPDATE';

                    if (!isInsert && !isUpdate) return;

                    const record = payload.new as any;

                    // Small delay to ensure DB triggers/relationships sync before checking RPC
                    setTimeout(async () => {
                        // Re-fetch everything, or we could manually check if user is involved
                        await fetchUnread();

                        // To show toast, we need to know if the user is involved. 
                        // The easiest way is to fetch the unread list and see if this task is in it NOW.
                        const { data: latestUnread } = await supabase.rpc('get_unread_tarefas');
                        const isUnread = latestUnread?.some((t: any) => t.tarefa_id === record.id);

                        // We might not want to toast the sender if they created it.
                        if (isUnread && record.remetente_id !== user.id) {
                            if (isInsert) {
                                showFeedback('info', `Nova Tarefa: ${record.titulo}`);
                            } else if (isUpdate) {
                                showFeedback('info', `Status atualizado: ${record.titulo} para ${record.status_tarefa}`);
                            }
                        }
                    }, 500);
                }
            )
            // Listen to new chats
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'geral_tarefa_chats' },
                (payload) => {
                    const record = payload.new as any;
                    if (record.usuario_id !== user.id) {
                        setTimeout(() => fetchUnread(), 200);
                        // showFeedback('info', `Nova mensagem na tarefa`);
                        // Opted out of chat toasts to prevent spam if they chat often, only marking as unread.
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, showFeedback]);

    return (
        <TarefasNotificationContext.Provider value={{ unreadTaskIds, markAsRead, refreshUnread: fetchUnread }}>
            {children}
        </TarefasNotificationContext.Provider>
    );
};

export const useTarefasNotification = () => {
    const context = useContext(TarefasNotificationContext);
    if (context === undefined) {
        throw new Error('useTarefasNotification must be used within a TarefasNotificationProvider');
    }
    return context;
};
