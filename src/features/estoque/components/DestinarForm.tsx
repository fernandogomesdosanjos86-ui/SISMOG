import { useState, useEffect, type FC, type FormEvent } from 'react';

import { useModal } from '../../../context/ModalContext';
import { equipamentosService } from '../../../services/equipamentosService';
import { financeiroService } from '../../../services/financeiroService';
import type { Equipamento, EquipamentoCategoria } from '../types';
import type { Contrato } from '../../financeiro/types';
import PrimaryButton from '../../../components/PrimaryButton';

interface Props {
    onSuccess?: () => void;
}

const DestinarForm: FC<Props> = ({ onSuccess }) => {

    const { closeModal, showFeedback } = useModal();
    const [loading, setLoading] = useState(false);

    // Data Sources
    const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
    const [postos, setPostos] = useState<Contrato[]>([]);

    // Form State
    const [selectedCategoria, setSelectedCategoria] = useState<EquipamentoCategoria>('Armamentos');
    const [selectedEquipamento, setSelectedEquipamento] = useState('');
    const [selectedPosto, setSelectedPosto] = useState('');
    const [quantidade, setQuantidade] = useState(1);

    // Fetch Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [eqData, ctData] = await Promise.all([
                    equipamentosService.getEquipamentos(),
                    financeiroService.getContratos()
                ]);

                setEquipamentos(eqData.filter((e: Equipamento) => e.status === 'Ativo' && (e.disponivel || 0) > 0));

                // Filter Postos: Active and FEMOG
                setPostos(ctData.filter((c: Contrato) => c.status === 'ativo' && c.empresa === 'FEMOG'));
            } catch (error) {
                console.error(error);
                showFeedback('error', 'Erro ao carregar dados');
            }
        };
        loadData();
    }, []);

    // Filtered Equipments based on Category
    const filteredEquipamentos = equipamentos.filter(e => e.categoria === selectedCategoria);

    // Reset equipment selection when category changes
    useEffect(() => {
        setSelectedEquipamento('');
        setQuantidade(1);
    }, [selectedCategoria]);

    const handleSubmit = async (e: FormEvent) => {

        e.preventDefault();
        if (!selectedEquipamento || !selectedPosto) return;

        setLoading(true);
        try {
            await equipamentosService.destinarEquipamento({
                equipamento_id: selectedEquipamento,
                contrato_id: selectedPosto,
                quantidade: quantidade
            });
            showFeedback('success', 'Equipamento destinado com sucesso!');
            if (onSuccess) onSuccess();
            closeModal();
        } catch (error) {
            console.error(error);
            showFeedback('error', 'Erro ao destinar equipamento.');
        } finally {
            setLoading(false);
        }
    };

    const currentEquip = equipamentos.find(e => e.id === selectedEquipamento);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Categoria</label>
                <select
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    value={selectedCategoria}
                    onChange={(e) => setSelectedCategoria(e.target.value as EquipamentoCategoria)}
                >
                    <option value="Armamentos">Armamentos</option>
                    <option value="Coletes Balísticos">Coletes Balísticos</option>
                    <option value="Munições">Munições</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Equipamento Disponível</label>
                <select
                    required
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    value={selectedEquipamento}
                    onChange={(e) => setSelectedEquipamento(e.target.value)}
                >
                    <option value="">Selecione...</option>
                    {filteredEquipamentos.map(eq => (
                        <option key={eq.id} value={eq.id}>
                            {eq.descricao} {eq.identificacao ? `- ${eq.identificacao}` : ''} ({eq.disponivel} disp.)
                        </option>
                    ))}
                </select>
                {filteredEquipamentos.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Nenhum equipamento disponível nesta categoria.</p>
                )}
            </div>

            {selectedCategoria === 'Munições' && currentEquip && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                    <input
                        type="number"
                        min="1"
                        max={currentEquip.disponivel}
                        required
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        value={quantidade}
                        onChange={(e) => setQuantidade(parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">Máximo: {currentEquip.disponivel}</p>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700">Posto de Trabalho (FEMOG)</label>
                <select
                    required
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    value={selectedPosto}
                    onChange={(e) => setSelectedPosto(e.target.value)}
                >
                    <option value="">Selecione...</option>
                    {postos.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.nome_posto} ({p.contratante})
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancelar
                </button>
                <PrimaryButton type="submit" disabled={loading || !selectedEquipamento || !selectedPosto}>
                    {loading ? 'Processando...' : 'Destinar'}
                </PrimaryButton>
            </div>

        </form>
    );
};

export default DestinarForm;
