import { useEffect, useState, type FC } from 'react';
import type { ContaFinanceira, ContaFinanceiraAjuste } from '../types';
import { financeiroService } from '../../../services/financeiroService';
import { useModal } from '../../../context/ModalContext';
import { formatCurrency } from '../../../utils/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUpCircle, ArrowDownCircle, History, User } from 'lucide-react';

interface HistoricoAjustesModalProps {
    conta: ContaFinanceira;
}

const HistoricoAjustesModal: FC<HistoricoAjustesModalProps> = ({ conta }) => {
    const { closeModal } = useModal();
    const [ajustes, setAjustes] = useState<ContaFinanceiraAjuste[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchHistorico = async () => {
            try {
                setLoading(true);
                const data = await financeiroService.getHistoricoAjustes(conta.id);
                if (isMounted) setAjustes(data);
            } catch (err) {
                console.error('Erro ao carregar histórico de ajustes:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchHistorico();
        return () => {
            isMounted = false;
        };
    }, [conta.id]);

    return (
        <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-gray-900">{conta.nome}</h4>
                    <p className="text-xs text-gray-500">Histórico de ajustes e conciliações de saldo</p>
                </div>
                <div className="text-right">
                    <span className="text-xs text-gray-400 block">Saldo Atual</span>
                    <span className="font-bold text-gray-900">{formatCurrency(conta.saldo_atual)}</span>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : ajustes.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">
                    <History size={36} className="mx-auto mb-2 text-gray-300" />
                    Nenhum ajuste de conciliação foi realizado nesta conta até o momento.
                </div>
            ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                    {ajustes.map((item) => {
                        const isCredito = item.tipo_ajuste === 'credito';
                        return (
                            <div
                                key={item.id}
                                className="p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col gap-2 hover:border-gray-200 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isCredito ? (
                                            <ArrowUpCircle size={18} className="text-emerald-600" />
                                        ) : (
                                            <ArrowDownCircle size={18} className="text-rose-600" />
                                        )}
                                        <span className="font-semibold text-sm text-gray-800">
                                            {isCredito ? 'Ajuste de Crédito' : 'Ajuste de Débito'}
                                        </span>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                                isCredito
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-rose-50 text-rose-700'
                                            }`}
                                        >
                                            {isCredito ? `+${formatCurrency(item.diferenca)}` : formatCurrency(item.diferenca)}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">
                                        {item.data_ajuste
                                            ? format(new Date(item.data_ajuste + 'T00:00:00'), 'dd/MM/yyyy', {
                                                  locale: ptBR
                                              })
                                            : '-'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                    <div>
                                        <span className="text-gray-400 block text-[11px]">Saldo Anterior</span>
                                        <span className="font-medium text-gray-700">
                                            {formatCurrency(item.saldo_anterior)}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-gray-400 block text-[11px]">Novo Saldo Conciliado</span>
                                        <span className="font-bold text-gray-900">
                                            {formatCurrency(item.saldo_novo)}
                                        </span>
                                    </div>
                                </div>

                                {item.motivo && (
                                    <p className="text-xs text-gray-600 italic">
                                        &ldquo;{item.motivo}&rdquo;
                                    </p>
                                )}

                                {item.usuario_nome && (
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 pt-1 border-t border-gray-50">
                                        <User size={12} />
                                        <span>Responsável: {item.usuario_nome}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100">
                <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    Fechar
                </button>
            </div>
        </div>
    );
};

export default HistoricoAjustesModal;
