import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useModal } from '../../../../context/ModalContext';
import { useTarefaDetail, useMissoes, useTarefaChat } from '../hooks/useTarefas';
import { useTarefasNotification } from '../context/TarefasNotificationContext';
import TarefaStatusBadge from './TarefaStatusBadge';
import { Send, CheckCircle, CheckSquare, ListTodo, MessageSquare, Paperclip, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Tarefa, StatusTarefaMissao } from '../types';

const getShortName = (fullName?: string): string => {
    if (!fullName) return 'Desconhecido';
    return fullName.trim().split(' ').slice(0, 2).join(' ');
};

interface TarefaDetailsProps {
    tarefa: Tarefa;
}

const prioridadeColors: Record<string, string> = {
    'Normal': 'bg-gray-100 text-gray-800',
    'Urgente': 'bg-red-100 text-red-800',
};

type TabType = 'DADOS' | 'MISSOES' | 'CHAT';

export default function TarefaDetails({ tarefa: initialTarefa }: TarefaDetailsProps) {
    const { user } = useAuth();
    const { openConfirmModal } = useModal();
    const [activeTab, setActiveTab] = useState<TabType>('DADOS');
    const { unreadTaskIds, markAsRead } = useTarefasNotification();

    // Live data fetching for reactive updates
    const { tarefa: liveTarefa } = useTarefaDetail(initialTarefa.id);
    const tarefa = liveTarefa || initialTarefa;

    // Auth Check
    const isSender = user?.id === tarefa.remetente_id;
    const isDestinatario = tarefa.destinatarios?.some(d => d.usuario_id === user?.id);
    const canInteract = isSender || isDestinatario;

    // Hooks
    const { updateMissaoStatus, isUpdating: updatingMissao } = useMissoes();
    const { chats, sendMessage, isSending } = useTarefaChat(tarefa.id);

    // Chat State
    const [chatText, setChatText] = useState('');
    const [chatFile, setChatFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Mark as read when component mounts or task changes and is unread
    useEffect(() => {
        if (tarefa?.id && unreadTaskIds.includes(tarefa.id)) {
            markAsRead(tarefa.id);
        }
    }, [tarefa?.id, unreadTaskIds, markAsRead]);

    useEffect(() => {
        if (activeTab === 'CHAT') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chats, activeTab]);

    const handleSendChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatText.trim() && !chatFile) return;

        try {
            await sendMessage({ chat: chatText, arquivo: chatFile });
            setChatText('');
            setChatFile(null);
        } catch (error) {
            console.error(error);
        }
    };

    const getNextStatus = (current: StatusTarefaMissao): StatusTarefaMissao => {
        if (current === 'Pendente') return 'Em Andamento';
        if (current === 'Em Andamento') return 'Concluído';
        return 'Pendente';
    };

    const handleMissaoToggle = (missaoId: string, currentStatus: StatusTarefaMissao) => {
        if (!canInteract || updatingMissao) return;

        const nextStatus = getNextStatus(currentStatus);

        openConfirmModal(
            'Alterar Status da Missão',
            `Deseja alterar o status de "${currentStatus}" para "${nextStatus}"?`,
            async () => {
                await updateMissaoStatus({ missaoId, novoStatus: nextStatus });
            }
        );
    };

    return (
        <div className="-mx-6 -mt-4 -mb-4 h-full flex flex-col">

            {/* Sticky Container for Header and Tabs */}
            <div className="sticky -top-4 z-20 flex flex-col bg-gray-50 shadow-sm border-b">
                {/* Header */}
                <div className="px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start md:items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900 break-words w-full sm:w-auto">{tarefa.titulo}</h2>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center ${prioridadeColors[tarefa.prioridade]}`}>
                                {tarefa.prioridade}
                            </span>
                            <TarefaStatusBadge status={tarefa.status_tarefa} />
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex overflow-x-auto bg-white px-2 sm:px-6 hide-scrollbar">
                    <button
                        onClick={() => setActiveTab('DADOS')}
                        className={`flex-1 sm:flex-none px-2 sm:px-4 py-3 font-medium text-sm flex items-center justify-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'DADOS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <ListTodo size={16} className="mr-2" />
                        Tarefa
                    </button>
                    <button
                        onClick={() => setActiveTab('MISSOES')}
                        className={`flex-1 sm:flex-none px-2 sm:px-4 py-3 font-medium text-sm flex items-center justify-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'MISSOES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <CheckSquare size={16} className="mr-2" />
                        Missões
                    </button>
                    <button
                        onClick={() => setActiveTab('CHAT')}
                        className={`flex-1 sm:flex-none px-2 sm:px-4 py-3 font-medium text-sm flex items-center justify-center border-b-2 transition-colors whitespace-nowrap ${activeTab === 'CHAT' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <MessageSquare size={16} className="mr-2" />
                        Chat
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-6 py-4 bg-gray-50 flex-1">

                {/* DADOS TAB */}
                {activeTab === 'DADOS' && (
                    <div className="space-y-6">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-900 mb-4 border-b pb-2">Tarefa</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-gray-500 mb-1">Remetente (Criador)</span>
                                    <span className="font-medium text-gray-900 block truncate" title={tarefa.remetente?.nome || 'Desconhecido'}>
                                        {getShortName(tarefa.remetente?.nome)}
                                    </span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 mb-1">Destinatários ({tarefa.destinatarios?.length || 0})</span>
                                    <div className="flex flex-col gap-1">
                                        {tarefa.destinatarios?.length ? tarefa.destinatarios.map(d => (
                                            <span key={d.usuario_id} className="font-medium text-gray-900 truncate" title={d.usuario?.nome}>
                                                &bull; {getShortName(d.usuario?.nome)}
                                            </span>
                                        )) : <span className="italic text-gray-400">Nenhum</span>}
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-gray-500 mb-1">Prazo Limite</span>
                                    <span className="font-medium text-gray-900">{format(parseISO(tarefa.data_limite), "dd 'de' MMMM", { locale: ptBR })}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 mb-1">Solicitado em</span>
                                    <span className="font-medium text-gray-900">{format(parseISO(tarefa.data_solicitacao), "dd/MM/yyyy")}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MISSOES TAB */}
                {activeTab === 'MISSOES' && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-900">Etapas a cumprir ({tarefa.missoes?.length || 0})</h3>
                            {canInteract && (
                                <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Clique no status para avançar a etapa</p>
                            )}
                        </div>

                        {tarefa.missoes?.map((m, idx) => (
                            <div key={m.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between group">
                                <div className="flex-1 pr-4">
                                    <div className="flex items-center mb-1">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">#{idx + 1}</span>
                                        <span
                                            className={`cursor-pointer transition-opacity ${canInteract ? 'hover:opacity-75' : ''}`}
                                            onClick={() => handleMissaoToggle(m.id, m.status_missao)}
                                            title={canInteract ? "Alterar Status" : ""}
                                        >
                                            <TarefaStatusBadge status={m.status_missao} />
                                        </span>
                                    </div>
                                    <p className={`text-sm ${m.status_missao === 'Concluído' ? 'line-through text-gray-400' : 'text-gray-900 font-medium'}`}>
                                        {m.missao}
                                    </p>
                                    {m.observacoes && (
                                        <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded italic">
                                            "{m.observacoes}"
                                        </p>
                                    )}
                                </div>
                                {m.status_missao === 'Concluído' && <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={20} />}
                            </div>
                        ))}
                    </div>
                )}

                {/* CHAT TAB */}
                {activeTab === 'CHAT' && (
                    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Messages List */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {chats.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <MessageSquare size={32} className="mb-2 opacity-50" />
                                    <p className="text-sm">Nenhum comentário na tarefa ainda</p>
                                </div>
                            ) : (
                                chats.map((c) => {
                                    const isMe = c.usuario_id === user?.id;
                                    return (
                                        <div key={c.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <span className="text-[10px] text-gray-400 mb-0.5 mx-1">
                                                {isMe ? 'Você' : getShortName(c.usuario?.nome)} &bull; {format(new Date(c.data_hora), "HH:mm")}
                                            </span>
                                            <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'}`}>
                                                <p className="text-sm break-words whitespace-pre-wrap">{c.chat}</p>
                                            </div>
                                            {c.arquivo_url && (
                                                <a href={c.arquivo_url} target="_blank" rel="noopener noreferrer"
                                                    className="mt-1 flex items-center text-xs text-blue-600 hover:underline mx-1">
                                                    <Download size={12} className="mr-1" />
                                                    Anexo
                                                </a>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area - Sticky at bottom */}
                        {canInteract && (
                            <div className="sticky bottom-0 border-t p-3 bg-gray-50 -mx-6 -mb-4 px-6 pb-4 flex-shrink-0">
                                {chatFile && (
                                    <div className="mb-2 px-3 py-1 bg-white border border-blue-200 rounded-md flex justify-between items-center text-xs">
                                        <span className="truncate flex-1 font-medium text-blue-800">{chatFile.name}</span>
                                        <button type="button" onClick={() => setChatFile(null)} className="text-gray-400 hover:text-red-500 ml-2">Remover</button>
                                    </div>
                                )}
                                <form onSubmit={handleSendChat} className="flex gap-2 items-center overflow-hidden">
                                    <label className="cursor-pointer p-1.5 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0" title="Anexar Arquivo">
                                        <Paperclip size={18} />
                                        <input
                                            type="file"
                                            onChange={e => e.target.files && setChatFile(e.target.files[0])}
                                            className="hidden"
                                        />
                                    </label>

                                    <input
                                        type="text"
                                        value={chatText}
                                        onChange={e => setChatText(e.target.value)}
                                        placeholder="Comente algo ou anexe..."
                                        className="min-w-0 flex-1 px-3 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    />

                                    <button
                                        type="submit"
                                        disabled={isSending || (!chatText.trim() && !chatFile)}
                                        className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                                    >
                                        <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
