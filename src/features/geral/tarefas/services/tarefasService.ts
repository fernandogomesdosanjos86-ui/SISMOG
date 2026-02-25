import { supabase } from '../../../../services/supabase';
import type { Tarefa, TarefaFormData, TarefaChat, ChatFormData } from '../types';

export const tarefasService = {
    async getTarefas(): Promise<Tarefa[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        // The RLS policy already filters the tasks the user can see.
        const { data, error } = await supabase
            .from('geral_tarefas')
            .select(`
                *,
                remetente:usuarios!fk_tarefas_remetente_usuarios(id, nome),
                destinatarios:geral_tarefa_destinatarios(
                    id, tarefa_id, usuario_id,
                    usuario:usuarios!fk_destinatarios_usuario_usuarios(id, nome)
                ),
                missoes:geral_missoes(*)
            `)
            .order('data_limite', { ascending: true });

        if (error) {
            console.error('Error fetching tarefas:', error);
            throw error;
        }

        // Map auth.users response since Supabase generic relations to auth schema might return arrays when joined
        const rawData = data as any[];
        return (rawData || []).map(t => ({
            ...t,
            remetente: t.remetente ? { id: t.remetente.id, nome: t.remetente.nome } : undefined,
            destinatarios: t.destinatarios?.map((d: any) => ({
                ...d,
                usuario: d.usuario ? { id: d.usuario.id, nome: d.usuario.nome } : undefined
            }))
        })) as Tarefa[];
    },

    async getTarefaById(id: string): Promise<Tarefa> {
        const { data, error } = await supabase
            .from('geral_tarefas')
            .select(`
                *,
                remetente:usuarios!fk_tarefas_remetente_usuarios(id, nome),
                destinatarios:geral_tarefa_destinatarios(
                    id, tarefa_id, usuario_id,
                    usuario:usuarios!fk_destinatarios_usuario_usuarios(id, nome)
                ),
                missoes:geral_missoes(*),
                chats:geral_tarefa_chats(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        const t = data as any;
        return {
            ...t,
            remetente: t.remetente ? { id: t.remetente.id, nome: t.remetente.nome } : undefined,
            destinatarios: t.destinatarios?.map((d: any) => ({
                ...d,
                usuario: d.usuario ? { id: d.usuario.id, nome: d.usuario.nome } : undefined
            }))
        } as Tarefa;
    },

    async createTarefa(formData: TarefaFormData): Promise<Tarefa> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        if (!formData.missoes || formData.missoes.length === 0) {
            throw new Error("Uma tarefa deve ter pelo menos uma missão.");
        }

        // 1. Create Tarefa
        const { data: tarefa, error: tarefaError } = await supabase
            .from('geral_tarefas')
            .insert([{
                data_solicitacao: formData.data_solicitacao,
                data_limite: formData.data_limite,
                titulo: formData.titulo,
                prioridade: formData.prioridade,
                remetente_id: user.id,
                // status_tarefa is default Pendente
            }])
            .select()
            .single();

        if (tarefaError) throw tarefaError;

        // 2. Create Destinatarios
        if (formData.destinatarios && formData.destinatarios.length > 0) {
            const destinatariosPayload = formData.destinatarios.map(usuario_id => ({
                tarefa_id: tarefa.id,
                usuario_id
            }));

            const { error: destError } = await supabase
                .from('geral_tarefa_destinatarios')
                .insert(destinatariosPayload);

            if (destError) {
                console.error("Error inserting destinatarios:", destError);
                // Rollback should ideally be handled by an RPC function for pure atomic transactions,
                // but we can afford sequential creation here if UI blocks on success.
            }
        }

        // 3. Create Missoes
        const missoesPayload = formData.missoes.map(m => ({
            tarefa_id: tarefa.id,
            missao: m.missao,
            observacoes: m.observacoes || null,
            // status_missao is default Pendente
        }));

        const { error: missoesError } = await supabase
            .from('geral_missoes')
            .insert(missoesPayload);

        if (missoesError) {
            console.error("Error inserting missoes:", missoesError);
        }

        return this.getTarefaById(tarefa.id);
    },

    async updateTarefa(id: string, updates: Partial<TarefaFormData>): Promise<void> {
        const { error } = await supabase
            .from('geral_tarefas')
            .update({
                titulo: updates.titulo,
                data_solicitacao: updates.data_solicitacao,
                data_limite: updates.data_limite,
                prioridade: updates.prioridade,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;

        // Sync destinatarios if provided
        if (updates.destinatarios) {
            // Remove all existing
            const { error: deleteError } = await supabase
                .from('geral_tarefa_destinatarios')
                .delete()
                .eq('tarefa_id', id);

            if (deleteError) {
                console.error('Error removing old destinatarios:', deleteError);
            }

            // Insert new set
            if (updates.destinatarios.length > 0) {
                const payload = updates.destinatarios.map(usuario_id => ({
                    tarefa_id: id,
                    usuario_id
                }));

                const { error: insertError } = await supabase
                    .from('geral_tarefa_destinatarios')
                    .insert(payload);

                if (insertError) {
                    console.error('Error inserting new destinatarios:', insertError);
                }
            }
        }
    },

    async deleteTarefa(id: string): Promise<void> {
        const { error } = await supabase
            .from('geral_tarefas')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async addMissao(tarefaId: string, missao: string, observacoes?: string): Promise<void> {
        const { error } = await supabase
            .from('geral_missoes')
            .insert([{
                tarefa_id: tarefaId,
                missao,
                observacoes: observacoes || null
            }]);

        if (error) throw error;
    },

    async updateMissaoStatus(missaoId: string, novoStatus: Tarefa['status_tarefa']): Promise<void> {
        const { error } = await supabase
            .from('geral_missoes')
            .update({
                status_missao: novoStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', missaoId);

        if (error) throw error;
    },

    async getChatsByTarefa(tarefaId: string): Promise<TarefaChat[]> {
        const { data, error } = await supabase
            .from('geral_tarefa_chats')
            .select(`
                *,
                usuario:usuarios!fk_chats_usuario_usuarios(id, nome)
            `)
            .eq('tarefa_id', tarefaId)
            .order('data_hora', { ascending: true });

        if (error) throw error;

        const rawData = data as any[];
        return (rawData || []).map(c => ({
            ...c,
            usuario: c.usuario ? { id: c.usuario.id, nome: c.usuario.nome } : undefined
        })) as TarefaChat[];
    },

    async sendChatMessage(tarefaId: string, formData: ChatFormData): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        let arquivo_url = null;

        if (formData.arquivo) {
            const fileExt = formData.arquivo.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${tarefaId}/${fileName}`; // Group inside task folder

            const { error: uploadError } = await supabase.storage
                .from('tarefas-chat')
                .upload(filePath, formData.arquivo);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('tarefas-chat').getPublicUrl(filePath);
            arquivo_url = data.publicUrl;
        }

        const { error } = await supabase
            .from('geral_tarefa_chats')
            .insert([{
                tarefa_id: tarefaId,
                usuario_id: user.id,
                chat: formData.chat,
                arquivo_url
            }]);

        if (error) throw error;
    }
};
