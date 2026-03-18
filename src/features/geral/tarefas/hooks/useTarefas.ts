import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../../lib/queryClient';
import { tarefasService } from '../services/tarefasService';
import { useModal } from '../../../../context/ModalContext';
import type { TarefaFormData, ChatFormData, StatusTarefaMissao } from '../types';

export const useTarefas = () => {
    const queryClient = useQueryClient();
    const { showFeedback } = useModal();

    const tarefasQuery = useQuery({
        queryKey: queryKeys.tarefas.list(),
        queryFn: () => tarefasService.getTarefas(),
    });

    const createTarefa = useMutation({
        mutationFn: (data: TarefaFormData) => tarefasService.createTarefa(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tarefas.all });
            showFeedback('success', 'A Tarefa e suas Missões foram criadas com sucesso!');
        },
        onError: (error) => {
            console.error('Create Tarefa Error:', error);
            showFeedback('error', 'Ops! Tivemos um problema ao salvar a tarefa no banco de dados.');
        }
    });

    const updateTarefa = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<TarefaFormData> }) => tarefasService.updateTarefa(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tarefas.all });
            showFeedback('success', 'Dados da Tarefa atualizados!');
        },
        onError: (error) => {
            console.error('Update Tarefa Error:', error);
            showFeedback('error', 'Erro ao salvar alterações da tarefa.');
        }
    });

    const deleteTarefa = useMutation({
        mutationFn: (id: string) => tarefasService.deleteTarefa(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tarefas.all });
            // Feedback happens in the UI calling this
        },
        onError: (error) => {
            console.error('Delete Tarefa Error:', error);
            showFeedback('error', 'Sem permissão ou erro ao excluir a tarefa.');
        }
    });

    return {
        tarefas: tarefasQuery.data || [],
        isLoading: tarefasQuery.isLoading,
        error: tarefasQuery.error,
        refetch: tarefasQuery.refetch,
        create: createTarefa.mutateAsync,
        update: updateTarefa.mutateAsync,
        delete: deleteTarefa.mutateAsync,
    };
};

export const useTarefaDetail = (tarefaId: string) => {
    const tarefaQuery = useQuery({
        queryKey: queryKeys.tarefas.detail(tarefaId),
        queryFn: () => tarefasService.getTarefaById(tarefaId),
        enabled: !!tarefaId,
    });

    return {
        tarefa: tarefaQuery.data,
        isLoading: tarefaQuery.isLoading,
        refetch: tarefaQuery.refetch,
    };
};

export const useMissoes = () => {
    const queryClient = useQueryClient();
    const { showFeedback } = useModal();

    const updateMissaoStatus = useMutation({
        mutationFn: ({ missaoId, novoStatus }: { missaoId: string, novoStatus: StatusTarefaMissao }) =>
            tarefasService.updateMissaoStatus(missaoId, novoStatus),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tarefas.all });
            showFeedback('success', 'Status da missão modificado!');
        },
        onError: (error) => {
            console.error('Update Missao Error:', error);
            showFeedback('error', 'Erro ao alterar o status da missão. Permissão negada?');
        }
    });

    return {
        updateMissaoStatus: updateMissaoStatus.mutateAsync,
        isUpdating: updateMissaoStatus.isPending
    };
}

export const useTarefaChat = (tarefaId: string) => {
    const queryClient = useQueryClient();
    const { showFeedback } = useModal();

    const chatQuery = useQuery({
        queryKey: queryKeys.tarefas.chat(tarefaId),
        queryFn: () => tarefasService.getChatsByTarefa(tarefaId),
        refetchInterval: 10000, // Very simple polling every 10 seconds for new messages
    });

    const sendChatMessage = useMutation({
        mutationFn: (data: ChatFormData) => tarefasService.sendChatMessage(tarefaId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.tarefas.chat(tarefaId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.tarefas.all }); // Some main list might have "last message"
        },
        onError: (error) => {
            console.error('Send Chat Error:', error);
            showFeedback('error', 'Erro ao enviar a mensagem para o chat.');
        }
    });

    return {
        chats: chatQuery.data || [],
        isLoading: chatQuery.isLoading,
        refetch: chatQuery.refetch,
        sendMessage: sendChatMessage.mutateAsync,
        isSending: sendChatMessage.isPending,
    };
}
