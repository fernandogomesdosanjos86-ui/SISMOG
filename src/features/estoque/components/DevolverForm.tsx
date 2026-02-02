import React, { useState, useEffect } from 'react';
import { useModal } from '../../../context/ModalContext';
import { equipamentosService } from '../../../services/equipamentosService';
import type { EquipamentoDestinacao, EquipamentoCategoria } from '../types';

interface Props {
    onSuccess?: () => void;
}

const DevolverForm: React.FC<Props> = ({ onSuccess }) => {
    const { closeModal, showFeedback } = useModal();
    const [loading, setLoading] = useState(false);

    // Data Sources
    const [destinacoes, setDestinacoes] = useState<EquipamentoDestinacao[]>([]);

    // Form State
    const [selectedPostoId, setSelectedPostoId] = useState('');
    const [selectedCategoria, setSelectedCategoria] = useState<EquipamentoCategoria>('Armamentos');
    const [selectedDestinacaoId, setSelectedDestinacaoId] = useState('');
    const [quantidade, setQuantidade] = useState(1);

    // Fetch Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await equipamentosService.getDestinacoes();
                setDestinacoes(data);
            } catch (error) {
                console.error(error);
                showFeedback('error', 'Erro ao carregar dados');
            }
        };
        loadData();
    }, []);

    // Derived Lists
    const postosComEquipamento = Array.from(new Set(destinacoes.map(d => JSON.stringify({ id: d.contrato_id, nome: d.contratos?.nome_posto }))))
        .map(s => JSON.parse(s))
        .sort((a, b) => a.nome.localeCompare(b.nome));

    const categoriasNoPosto = selectedPostoId
        ? Array.from(new Set(destinacoes.filter(d => d.contrato_id === selectedPostoId).map(d => d.equipamentos?.categoria)))
        : [];

    const equipamentosNoPosto = selectedPostoId && selectedCategoria
        ? destinacoes.filter(d => d.contrato_id === selectedPostoId && d.equipamentos?.categoria === selectedCategoria)
        : [];

    // Reset dependant fields
    useEffect(() => {
        setSelectedCategoria('Armamentos');
        setSelectedDestinacaoId('');
    }, [selectedPostoId]);

    useEffect(() => {
        setSelectedDestinacaoId('');
    }, [selectedCategoria]);

    const currentDestinacao = destinacoes.find(d => d.id === selectedDestinacaoId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDestinacaoId) return;

        setLoading(true);
        try {
            const isPartial = currentDestinacao?.equipamentos?.categoria === 'Munições' && quantidade < (currentDestinacao?.quantidade || 0);

            await equipamentosService.devolverEquipamento(selectedDestinacaoId, isPartial ? quantidade : undefined);

            showFeedback('success', 'Equipamento devolvido com sucesso!');
            if (onSuccess) onSuccess();
            closeModal();
        } catch (error) {
            console.error(error);
            showFeedback('error', 'Erro ao devolver equipamento.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Posto de Trabalho</label>
                <select
                    required
                    className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    value={selectedPostoId}
                    onChange={(e) => setSelectedPostoId(e.target.value)}
                >
                    <option value="">Selecione...</option>
                    {postosComEquipamento.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.nome}
                        </option>
                    ))}
                </select>
            </div>

            {selectedPostoId && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Categoria</label>
                    <select
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        value={selectedCategoria}
                        onChange={(e) => setSelectedCategoria(e.target.value as EquipamentoCategoria)}
                    >
                        {categoriasNoPosto.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                        {categoriasNoPosto.length === 0 && <option value="">Sem categorias</option>}
                    </select>
                </div>
            )}

            {selectedPostoId && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Equipamento para Devolução</label>
                    <select
                        required
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        value={selectedDestinacaoId}
                        onChange={(e) => setSelectedDestinacaoId(e.target.value)}
                        disabled={categoriasNoPosto.length === 0}
                    >
                        <option value="">Selecione...</option>
                        {equipamentosNoPosto.map(d => (
                            <option key={d.id} value={d.id}>
                                {d.equipamentos?.descricao} {d.equipamentos?.identificacao ? `- ${d.equipamentos.identificacao}` : ''} ({d.quantidade} no posto)
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {currentDestinacao && currentDestinacao.equipamentos?.categoria === 'Munições' && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Quantidade a Devolver</label>
                    <input
                        type="number"
                        min="1"
                        max={currentDestinacao.quantidade}
                        required
                        className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        value={quantidade}
                        onChange={(e) => setQuantidade(parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500 mt-1">Total no posto: {currentDestinacao.quantidade}</p>
                </div>
            )}

            <div className="flex justify-end pt-4 border-t mt-4">
                <button
                    type="button"
                    onClick={closeModal}
                    className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading || !selectedDestinacaoId}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Processando...' : 'Devolver'}
                </button>
            </div>
        </form>
    );
};

export default DevolverForm;
