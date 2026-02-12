import React, { useState } from 'react';
import { Plus, Trash } from 'lucide-react';
import { useAlocacoes } from '../hooks/useAlocacoes';
import type { PostoTrabalho, AlocacaoFormData } from '../types';
import { useModal } from '../../../context/ModalContext';
import { useFuncionarios } from '../../rh/hooks/useFuncionarios';

interface PostoDetailsProps {
    posto: PostoTrabalho;
}

const PostoDetails: React.FC<PostoDetailsProps> = ({ posto }) => {
    const { alocacoes, isLoading, create, delete: deleteAlocacao } = useAlocacoes(posto.id);
    const { funcionarios } = useFuncionarios();
    const { openConfirmModal, showFeedback } = useModal();

    const [newAllocation, setNewAllocation] = useState<Partial<AlocacaoFormData>>({
        escala: '12x36',
        turno: 'Diurno',
        he: false
    });
    const [selectedFuncionarioId, setSelectedFuncionarioId] = useState('');

    // Filter employees: Active and Same Company
    const availableFuncionarios = funcionarios.filter(f =>
        f.status === 'ativo' && f.empresa === posto.empresa
    ).sort((a, b) => a.nome.localeCompare(b.nome));

    const handleAddAllocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFuncionarioId) {
            showFeedback('error', 'Selecione um funcionário.');
            return;
        }

        try {
            await create({
                posto_id: posto.id,
                funcionario_id: selectedFuncionarioId,
                escala: newAllocation.escala as any,
                turno: newAllocation.turno as any,
                he: newAllocation.he || false
            });
            setSelectedFuncionarioId('');
            setNewAllocation({ escala: '12x36', turno: 'Diurno', he: false });
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleDelete = (id: string, nome: string) => {
        openConfirmModal(
            'Remover Alocação',
            `Tem certeza que deseja remover a alocação de ${nome}?`,
            async () => {
                await deleteAlocacao(id);
            }
        );
    };

    return (
        <div className="space-y-6">
            {/* Info do Posto */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                    <span className="text-sm text-gray-500">Empresa</span>
                    <p className={`font-medium ${posto.empresa === 'FEMOG' ? 'text-blue-700' : 'text-orange-700'}`}>
                        {posto.empresa}
                    </p>
                </div>
                <div>
                    <span className="text-sm text-gray-500">Status</span>
                    <p className="font-medium capitalize">{posto.status}</p>
                </div>
            </div>

            {/* Adicionar Alocação */}
            <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium text-gray-900 border-b pb-2">Nova Alocação</h3>
                <form onSubmit={handleAddAllocation} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    <div className="md:col-span-6">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Funcionário</label>
                        <select
                            value={selectedFuncionarioId}
                            onChange={(e) => setSelectedFuncionarioId(e.target.value)}
                            className="w-full text-sm rounded-md border-gray-300 p-2 border"
                            required
                        >
                            <option value="">Selecione...</option>
                            {availableFuncionarios.map(f => (
                                <option key={f.id} value={f.id}>{f.nome}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Escala</label>
                        <select
                            value={newAllocation.escala}
                            onChange={(e) => setNewAllocation({ ...newAllocation, escala: e.target.value as any })}
                            className="w-full text-sm rounded-md border-gray-300 p-2 border"
                        >
                            <option value="12x36">12x36</option>
                            <option value="5x2">5x2</option>
                            <option value="5x1">5x1</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Turno</label>
                        <select
                            value={newAllocation.turno}
                            onChange={(e) => setNewAllocation({ ...newAllocation, turno: e.target.value as any })}
                            className="w-full text-sm rounded-md border-gray-300 p-2 border"
                        >
                            <option value="Diurno">Diurno</option>
                            <option value="Noturno">Noturno</option>
                        </select>
                    </div>
                    <div className="md:col-span-1 flex items-center justify-center pb-2">
                        <label className="inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={newAllocation.he}
                                onChange={(e) => setNewAllocation({ ...newAllocation, he: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">HE</span>
                        </label>
                    </div>
                    <div className="md:col-span-1">
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            title="Adicionar"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </form>
            </div>

            {/* Lista de Alocações */}
            <div>
                <h3 className="font-medium text-gray-900 mb-3">Funcionários Alocados ({alocacoes.length})</h3>
                {isLoading ? (
                    <div className="text-center py-4 text-gray-500">Carregando...</div>
                ) : alocacoes.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500 border border-dashed">
                        Nenhum funcionário alocado neste posto.
                    </div>
                ) : (
                    <div className="overflow-hidden border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome / Cargo</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Escala / Turno</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {alocacoes.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{item.funcionario?.nome}</div>
                                            <div className="text-xs text-gray-500">{item.funcionario?.cargo?.cargo || '-'}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{item.escala}</div>
                                            <div className="text-xs text-gray-500">{item.turno}</div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            {item.he ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                    Extra
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Oficial
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDelete(item.id, item.funcionario?.nome || '')}
                                                className="text-red-600 hover:text-red-900 transition-colors"
                                                title="Remover"
                                            >
                                                <Trash size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PostoDetails;
