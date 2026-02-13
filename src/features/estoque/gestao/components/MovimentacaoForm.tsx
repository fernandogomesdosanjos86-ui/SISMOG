import React, { useState, useEffect } from 'react';
import { useModal } from '../../../../context/ModalContext';
import { useProdutos } from '../hooks/useProdutos';
import { useFuncionarios } from '../../../rh/hooks/useFuncionarios';
import { usePostos } from '../../../supervisao/hooks/usePostos';
import { estoqueGestaoService } from '../../../../services/estoqueGestaoService';
import type { TipoMovimentacao, MovimentacaoFormData, TipoProduto } from '../types';

interface MovimentacaoFormProps {
    onSuccess: () => void;
    create: (data: MovimentacaoFormData) => Promise<any>;
    defaultTipo?: TipoMovimentacao;
}

const MovimentacaoForm: React.FC<MovimentacaoFormProps> = ({ onSuccess, create, defaultTipo }) => {
    const { closeModal, showFeedback } = useModal();
    const { produtos } = useProdutos();
    const { funcionarios } = useFuncionarios();
    const { postos } = usePostos();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tipoMov, setTipoMov] = useState<TipoMovimentacao>(defaultTipo || 'Compra');
    const [produtoId, setProdutoId] = useState('');
    const [quantidade, setQuantidade] = useState('1');
    const [data, setData] = useState(new Date().toISOString().split('T')[0]);
    const [funcionarioId, setFuncionarioId] = useState('');
    const [postoId, setPostoId] = useState('');
    const [observacao, setObservacao] = useState('');

    // Derived state
    const selectedProduto = produtos.find(p => p.id === produtoId);
    const tipoProduto: TipoProduto | null = selectedProduto?.tipo || null;
    const needsTarget = tipoMov === 'Entrega' || tipoMov === 'Devolução';
    const showFuncionario = needsTarget && tipoProduto === 'Individual';
    const showPosto = needsTarget && tipoProduto === 'Coletivo';

    // Saldo tracking
    const [maxQtd, setMaxQtd] = useState<number | null>(null);

    useEffect(() => {
        if (!produtoId) { setMaxQtd(null); return; }

        const fetchSaldo = async () => {
            try {
                if (tipoMov === 'Entrega' || tipoMov === 'Descarte') {
                    const saldo = await estoqueGestaoService.getSaldoEstoque(produtoId);
                    setMaxQtd(saldo);
                } else if (tipoMov === 'Devolução') {
                    if (funcionarioId) {
                        const saldo = await estoqueGestaoService.getSaldoFuncionario(funcionarioId, produtoId);
                        setMaxQtd(saldo);
                    } else if (postoId) {
                        const saldo = await estoqueGestaoService.getSaldoPosto(postoId, produtoId);
                        setMaxQtd(saldo);
                    } else {
                        setMaxQtd(null);
                    }
                } else {
                    setMaxQtd(null); // Compra has no limit
                }
            } catch { setMaxQtd(null); }
        };
        fetchSaldo();
    }, [produtoId, tipoMov, funcionarioId, postoId]);

    // Reset dependent fields when type changes
    useEffect(() => {
        setProdutoId('');
        setFuncionarioId('');
        setPostoId('');
        setQuantidade('1');
    }, [tipoMov]);

    // Filter products by availability
    const filteredProdutos = produtos.filter(p => {
        if (tipoMov === 'Entrega' || tipoMov === 'Descarte') return p.em_estoque > 0;
        return true; // Compra/Devolução: show all (devolução will filter by holder later)
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const qtd = parseInt(quantidade) || 0;
        if (qtd < 1) {
            showFeedback('error', 'Quantidade deve ser maior que zero.');
            return;
        }
        setIsSubmitting(true);
        try {
            const payload: MovimentacaoFormData = {
                tipo: tipoMov,
                produto_id: produtoId,
                quantidade: qtd,
                data,
                funcionario_id: showFuncionario ? funcionarioId : null,
                posto_id: showPosto ? postoId : null,
                observacao: observacao || null,
            };
            await create(payload);
            onSuccess();
            closeModal();
        } catch (error: any) {
            showFeedback('error', error.message || 'Erro ao registrar movimentação.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = "mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo Movimentação */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo Movimentação</label>
                    <select value={tipoMov} onChange={e => setTipoMov(e.target.value as TipoMovimentacao)} className={inputClass} required>
                        <option value="Compra">Compra</option>
                        <option value="Entrega">Entrega</option>
                        <option value="Devolução">Devolução</option>
                        <option value="Descarte">Descarte</option>
                    </select>
                </div>

                {/* Produto */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Produto</label>
                    <select value={produtoId} onChange={e => setProdutoId(e.target.value)} className={inputClass} required>
                        <option value="">Selecione...</option>
                        {filteredProdutos.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.codigo} ({p.tipo}) — Estoque: {p.em_estoque}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Quantidade */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Quantidade
                        {maxQtd !== null && tipoMov !== 'Compra' && (
                            <span className="text-xs text-gray-400 ml-1">(máx: {maxQtd})</span>
                        )}
                    </label>
                    <input
                        type="number"
                        value={quantidade}
                        onChange={e => setQuantidade(e.target.value)}
                        min={1}
                        max={maxQtd !== null && tipoMov !== 'Compra' ? maxQtd : undefined}
                        className={inputClass}
                        required
                    />
                </div>

                {/* Data */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Data</label>
                    <input
                        type="date"
                        value={data}
                        onChange={e => setData(e.target.value)}
                        className={inputClass}
                        required
                    />
                </div>

                {/* Funcionário (Individual + Entrega/Devolução) */}
                {showFuncionario && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Funcionário</label>
                        <select value={funcionarioId} onChange={e => setFuncionarioId(e.target.value)} className={inputClass} required>
                            <option value="">Selecione...</option>
                            {funcionarios
                                .filter(f => f.status === 'ativo')
                                .map(f => (
                                    <option key={f.id} value={f.id}>{f.nome} - {f.empresa}</option>
                                ))}
                        </select>
                    </div>
                )}

                {/* Posto (Coletivo + Entrega/Devolução) */}
                {showPosto && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Posto</label>
                        <select value={postoId} onChange={e => setPostoId(e.target.value)} className={inputClass} required>
                            <option value="">Selecione...</option>
                            {postos
                                .filter(p => p.status === 'ativo')
                                .map(p => (
                                    <option key={p.id} value={p.id}>{p.nome} - {p.empresa}</option>
                                ))}
                        </select>
                    </div>
                )}

                {/* Observação */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Observação</label>
                    <input
                        type="text"
                        value={observacao}
                        onChange={e => setObservacao(e.target.value)}
                        className={inputClass}
                        placeholder="Opcional"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4 gap-3 border-t">
                <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {isSubmitting ? 'Salvando...' : 'Registrar'}
                </button>
            </div>
        </form>
    );
};

export default MovimentacaoForm;
