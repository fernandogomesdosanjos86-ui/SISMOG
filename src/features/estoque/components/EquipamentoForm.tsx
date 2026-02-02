import { useState, type FC, type FormEvent } from 'react';

import { useModal } from '../../../context/ModalContext';
import { equipamentosService } from '../../../services/equipamentosService';
import type { Equipamento, EquipamentoCategoria, EquipamentoStatus } from '../types';

interface Props {
    initialData?: Equipamento;
    onSuccess?: () => void;
}

const EquipamentoForm: FC<Props> = ({ initialData, onSuccess }) => {

    const { closeModal, showFeedback } = useModal();
    const [loading, setLoading] = useState(false);

    // Form State
    const [categoria, setCategoria] = useState<EquipamentoCategoria>(initialData?.categoria || 'Armamentos');
    const [descricao, setDescricao] = useState(initialData?.descricao || '');
    const [identificacao, setIdentificacao] = useState(initialData?.identificacao || '');
    const [quantidade, setQuantidade] = useState(initialData?.quantidade || 1);
    const [status, setStatus] = useState<EquipamentoStatus>(initialData?.status || 'Ativo');

    const handleSubmit = async (e: FormEvent) => {

        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                categoria,
                descricao,
                identificacao: categoria !== 'Munições' ? identificacao : undefined, // Clear ID for ammo

                quantidade: (categoria === 'Armamentos' || categoria === 'Coletes Balísticos') ? 1 : quantidade, // Force 1 for tracked items
                status
            };

            if (initialData) {
                await equipamentosService.updateEquipamento(initialData.id, data);
                showFeedback('success', 'Equipamento atualizado com sucesso!');
            } else {
                await equipamentosService.createEquipamento(data);
                showFeedback('success', 'Equipamento cadastrado com sucesso!');
            }
            if (onSuccess) onSuccess();
            closeModal();
        } catch (error) {
            console.error(error);
            showFeedback('error', 'Erro ao salvar equipamento.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">Categoria</label>
                    <select
                        required
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                        value={categoria}
                        onChange={(e) => {
                            const newCat = e.target.value as EquipamentoCategoria;
                            setCategoria(newCat);
                            if (newCat === 'Armamentos' || newCat === 'Coletes Balísticos') {
                                setQuantidade(1);
                            }
                        }}
                    >
                        <option value="Armamentos">Armamentos</option>
                        <option value="Coletes Balísticos">Coletes Balísticos</option>
                        <option value="Munições">Munições</option>
                    </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                        required
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as EquipamentoStatus)}
                    >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                    </select>
                </div>

                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                    <input
                        type="text"
                        required
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Ex: Revólver Taurus Cal.38, Colete Nível IIIA..."
                    />
                </div>

                {categoria !== 'Munições' && (
                    <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Identificação (Serial)</label>
                        <input
                            type="text"
                            required
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500"
                            value={identificacao}
                            onChange={(e) => setIdentificacao(e.target.value)}
                        />
                    </div>
                )}

                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                    <input
                        type="number"
                        min="1"
                        required
                        disabled={categoria === 'Armamentos' || categoria === 'Coletes Balísticos'}
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                        value={quantidade}
                        onChange={(e) => setQuantidade(parseInt(e.target.value))}
                    />
                </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end pt-4 border-t mt-4 gap-3">
                <button
                    type="button"
                    onClick={closeModal}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center"
                >
                    {loading ? 'Salvando...' : 'Salvar'}
                </button>
            </div>

        </form>
    );
};

export default EquipamentoForm;
