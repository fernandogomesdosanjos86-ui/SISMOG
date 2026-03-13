import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { useTarefas } from '../hooks/useTarefas';
import { useModal } from '../../../../context/ModalContext';
import { supabase } from '../../../../services/supabase';
import type { Tarefa, TarefaFormData, PrioridadeTarefa } from '../types';

interface TarefaFormProps {
    onSuccess: () => void;
    initialData?: Tarefa;
}

export default function TarefaForm({ onSuccess, initialData }: TarefaFormProps) {
    const { create, update } = useTarefas();
    const { closeModal, showFeedback } = useModal();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!initialData;

    // Auth Usuarios fetch
    const [availableUsers, setAvailableUsers] = useState<{ id: string, nome: string }[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const { data, error } = await supabase.from('usuarios').select('id, nome').eq('ativo', true);
            if (!error && data) {
                setAvailableUsers(data);
            }
        };
        fetchUsers();
    }, []);

    const [formData, setFormData] = useState<TarefaFormData>({
        titulo: initialData?.titulo || '',
        data_solicitacao: initialData?.data_solicitacao || new Date().toISOString().split('T')[0],
        data_limite: initialData?.data_limite || new Date().toISOString().split('T')[0],
        prioridade: initialData?.prioridade || 'Normal',
        destinatarios: initialData?.destinatarios?.map(d => d.usuario_id) || [],
        missoes: initialData?.missoes?.map(m => ({ id: m.id, missao: m.missao, observacoes: m.observacoes || '' })) || [{ missao: '', observacoes: '' }]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.titulo.trim()) {
            showFeedback('error', 'O título da tarefa é obrigatório.');
            return;
        }

        const validMissoes = formData.missoes.filter(m => m.missao.trim() !== '');
        if (validMissoes.length === 0) {
            showFeedback('error', 'É obrigatório incluir ao menos 1 (uma) missão.');
            return;
        }

        try {
            setIsSubmitting(true);
            if (isEditing && initialData) {
                await update({
                    id: initialData.id, data: {
                        titulo: formData.titulo,
                        data_solicitacao: formData.data_solicitacao,
                        data_limite: formData.data_limite,
                        prioridade: formData.prioridade,
                        destinatarios: formData.destinatarios,
                        missoes: validMissoes
                    }
                });
            } else {
                await create({
                    ...formData,
                    missoes: validMissoes
                });
            }
            onSuccess();
            closeModal();
        } catch (err) {
            console.error("Form submit error", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addMissaoRow = () => {
        setFormData({
            ...formData,
            missoes: [...formData.missoes, { missao: '', observacoes: '' }]
        });
    };

    const removeMissaoRow = (index: number) => {
        const newMissoes = [...formData.missoes];
        newMissoes.splice(index, 1);
        setFormData({ ...formData, missoes: newMissoes });
    };

    const toggleDestinatario = (userId: string) => {
        setFormData(prev => {
            const exists = prev.destinatarios.includes(userId);
            if (exists) {
                return { ...prev, destinatarios: prev.destinatarios.filter(id => id !== userId) };
            } else {
                return { ...prev, destinatarios: [...prev.destinatarios, userId] };
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="p-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Título da Tarefa <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        required
                        value={formData.titulo}
                        onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                        placeholder="Ex: Revisar documentação do RH"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Prioridade <span className="text-red-500">*</span></label>
                    <select
                        required
                        value={formData.prioridade}
                        onChange={e => setFormData({ ...formData, prioridade: e.target.value as PrioridadeTarefa })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-white"
                    >
                        <option value="Normal">Normal</option>
                        <option value="Urgente">Urgente</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Data de Solicitação <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        required
                        value={formData.data_solicitacao}
                        onChange={e => setFormData({ ...formData, data_solicitacao: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Data Limite (Deadline) <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        required
                        value={formData.data_limite}
                        onChange={e => setFormData({ ...formData, data_limite: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                </div>
            </div>

            <div className="space-y-2 border-t pt-4">
                <label className="flex items-center text-sm font-medium text-gray-800">
                    <Users size={16} className="mr-2" />
                    Destinatários (Compartilhar Tarefa)
                </label>
                <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto p-2 bg-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableUsers.map(u => (
                        <label key={u.id} className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                            <input
                                type="checkbox"
                                checked={formData.destinatarios.includes(u.id)}
                                onChange={() => toggleDestinatario(u.id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="text-sm text-gray-700 font-medium truncate">{u.nome}</span>
                        </label>
                    ))}
                    {availableUsers.length === 0 && (
                        <div className="col-span-full text-center text-sm text-gray-500 py-4 italic">Buscando lista de usuários...</div>
                    )}
                </div>
            </div>

            <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between items-center bg-blue-50/50 p-2 rounded-lg">
                    <label className="text-sm font-bold text-blue-900">Missões da Tarefa <span className="text-red-500">*</span></label>
                    <button
                        type="button"
                        onClick={addMissaoRow}
                        className="text-xs flex items-center bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-full font-medium transition-colors"
                    >
                        <Plus size={14} className="mr-1" /> Adicionar Passo
                    </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto p-1">
                    {formData.missoes.map((m, index) => (
                        <div key={index} className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50 relative group">
                            <div className="flex items-start justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Missão #{index + 1}</span>
                                {formData.missoes.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeMissaoRow(index)}
                                        className="text-gray-400 hover:text-red-500 focus:outline-none transition-colors"
                                        title="Remover Missão"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                required
                                value={m.missao}
                                onChange={e => {
                                    const newM = [...formData.missoes];
                                    newM[index].missao = e.target.value;
                                    setFormData({ ...formData, missoes: newM });
                                }}
                                placeholder="O que deve ser feito?"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <input
                                type="text"
                                value={m.observacoes || ''}
                                onChange={e => {
                                    const newM = [...formData.missoes];
                                    newM[index].observacoes = e.target.value;
                                    setFormData({ ...formData, missoes: newM });
                                }}
                                placeholder="Observações (Opcional)"
                                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    {isSubmitting ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Salvando...
                        </>
                    ) : (
                        isEditing ? 'Salvar Alterações' : 'Criar Tarefa Mestra'
                    )}
                </button>
            </div>
        </form>
    );
}
