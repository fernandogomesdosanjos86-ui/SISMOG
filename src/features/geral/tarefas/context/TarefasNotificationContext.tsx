/* eslint-disable react-refresh/only-export-components, react-compiler/react-compiler */
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../../../../services/supabase';
import { useAuth } from '../../../../context/AuthContext';
import type { TarefaEventType } from '../types';

// Maps tarefa_id -> event_type (most recent event wins)
type EventMap = Map<string, TarefaEventType>;

interface TarefasNotificationContextType {
    unreadTaskIds: string[];
    unreadEvents: EventMap;
    unreadChatCount: number;
    unreadNovaCount: number;
    unreadStatusCount: number;
    markAsRead: (tarefaId: string) => Promise<void>;
    refreshUnread: () => Promise<void>;
}

export const TarefasNotificationContext = createContext<TarefasNotificationContextType | undefined>(undefined);

export const TarefasNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [unreadTaskIds, setUnreadTaskIds] = useState<string[]>([]);
    // Map tracking event type per tarefa_id – persists across re-renders without re-subscribing
    const eventMapRef = useRef<EventMap>(new Map());
    const [unreadEvents, setUnreadEvents] = useState<EventMap>(new Map());

    const fetchUnread = React.useCallback(async () => {
        if (!user) return;
        try {
            const { data: unreadData, error: rpcError } = await supabase.rpc('get_unread_tarefas');
            if (rpcError) throw rpcError;
            
            const unreadRows = unreadData as Record<string, unknown>[];
            if (unreadRows.length === 0) {
                setUnreadTaskIds([]);
                eventMapRef.current = new Map();
                setUnreadEvents(new Map());
                return;
            }

            // Extract IDs safely (depending on Postgres RPC return format it could be r.id, r.tarefa_id, or simply the value)
            const ids = Array.from(new Set(
                unreadRows.map(r => {
                    if (typeof r === 'string') return r;
                    return r.tarefa_id || r.id || r.get_unread_tarefas;
                }).filter(Boolean) as string[]
            ));

            if (ids.length === 0) {
                setUnreadTaskIds([]);
                return;
            }

            setUnreadTaskIds(ids);

            // Fetch metadata to differentiate event types
            const [tasksRes, chatsRes, leiturasRes] = await Promise.all([
                supabase.from('geral_tarefas').select('id, created_at, updated_at').in('id', ids),
                supabase.from('geral_tarefa_chats').select('tarefa_id, created_at').in('tarefa_id', ids).order('created_at', { ascending: false }),
                supabase.from('geral_tarefa_leituras').select('tarefa_id, ultima_leitura').eq('usuario_id', user.id).in('tarefa_id', ids)
            ]);

            const tasksMeta = tasksRes.data || [];
            const chatsMeta = chatsRes.data || [];
            const leiturasMeta = leiturasRes.data || [];

            const newEventMap: EventMap = new Map();
            
            ids.forEach(id => {
                const task = tasksMeta.find(t => t.id === id);
                const leitura = leiturasMeta.find(l => l.tarefa_id === id);
                
                if (!task) {
                    newEventMap.set(id, 'nova');
                    return;
                }

                // If it was already in our live map, keep it (Realtime info is most accurate for current session)
                const existingEvent = eventMapRef.current.get(id);
                if (existingEvent) {
                    newEventMap.set(id, existingEvent);
                    return;
                }

                const lastRead = leitura?.ultima_leitura ? new Date(leitura.ultima_leitura).getTime() : 0;
                
                // Fetch latest chat timestamp for this task
                const latestChat = chatsMeta.find(c => c.tarefa_id === id);
                const lastChatTime = latestChat ? new Date(latestChat.created_at).getTime() : 0;

                // LOGIC:
                // 1. If there's a chat more recent than the last read, it's a 'chat' event.
                // 2. Otherwise, if there is no last_read record (never read by this user), it's a 'nova' task.
                // 3. Otherwise, it must be a 'status' change
                if (lastChatTime > lastRead) {
                    newEventMap.set(id, 'chat');
                } else if (!leitura?.ultima_leitura) {
                    newEventMap.set(id, 'nova');
                } else {
                    // It was previously read, but RPC returned it anyway -> must be a status change
                    newEventMap.set(id, 'status');
                }
            });

            eventMapRef.current = newEventMap;
            setUnreadEvents(new Map(newEventMap));
        } catch (err) {
            console.error('Error fetching unread tasks:', err);
        }
    }, [user]);

    const setEventForTask = (tarefaId: string, type: TarefaEventType) => {
        eventMapRef.current.set(tarefaId, type);
        setUnreadEvents(new Map(eventMapRef.current));
    };

    const markAsRead = async (tarefaId: string) => {
        if (!user) return;

        // Optimistically remove from state
        setUnreadTaskIds(prev => prev.filter(id => id !== tarefaId));
        eventMapRef.current.delete(tarefaId);
        setUnreadEvents(new Map(eventMapRef.current));

        try {
            const { error } = await supabase
                .from('geral_tarefa_leituras')
                .upsert({
                    tarefa_id: tarefaId,
                    usuario_id: user.id,
                    ultima_leitura: new Date().toISOString()
                }, { onConflict: 'tarefa_id,usuario_id' });

            if (error) throw error;
        } catch (err) {
            console.error('Error marking task as read:', err);
            // Revert on error
            fetchUnread();
        }
    };

    // Initial load and Realtime Subscriptions
    useEffect(() => {
        if (!user) {
            setUnreadTaskIds([]);
            eventMapRef.current = new Map();
            setUnreadEvents(new Map());
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

                    const record = payload.new as { id: string; remetente_id: string };

                    // Ignore own actions
                    if (record.remetente_id === user.id) return;

                    const eventType: TarefaEventType = isInsert ? 'nova' : 'status';

                    // Small delay to ensure DB triggers/relationships sync
                    setTimeout(async () => {
                        await fetchUnread();
                        setEventForTask(record.id, eventType);
                    }, 500);
                }
            )
            // Listen to new chats
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'geral_tarefa_chats' },
                (payload) => {
                    const record = payload.new as { usuario_id: string; tarefa_id: string };
                    if (record.usuario_id !== user.id) {
                        setTimeout(async () => {
                            await fetchUnread();
                            setEventForTask(record.tarefa_id, 'chat');
                        }, 200);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchUnread]);

    // Derived counts from the event map
    const unreadChatCount = Array.from(unreadEvents.values()).filter(t => t === 'chat').length;
    const unreadNovaCount = Array.from(unreadEvents.values()).filter(t => t === 'nova').length;
    const unreadStatusCount = Array.from(unreadEvents.values()).filter(t => t === 'status').length;

    return (
        <TarefasNotificationContext.Provider value={{
            unreadTaskIds,
            unreadEvents,
            unreadChatCount,
            unreadNovaCount,
            unreadStatusCount,
            markAsRead,
            refreshUnread: fetchUnread
        }}>
            {children}
        </TarefasNotificationContext.Provider>
    );
};

// Hook co-located with provider — this is acceptable for context files.
export const useTarefasNotification = () => {
    const context = useContext(TarefasNotificationContext);
    if (context === undefined) {
        throw new Error('useTarefasNotification must be used within a TarefasNotificationProvider');
    }
    return context;
};
