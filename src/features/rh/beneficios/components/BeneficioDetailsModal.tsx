import React, { useState, useMemo } from 'react';
import CompanyBadge from '../../../../components/CompanyBadge';
import { Edit2, Save, Trash2, Calendar, DollarSign, User, Building2 } from 'lucide-react';
import type { BeneficioCalculado } from '../types';

interface BeneficioDetailsModalProps {
    beneficio: BeneficioCalculado;
    onSave: (updated: Partial<BeneficioCalculado> & { id: string }) => Promise<void>;
    onDelete: (id: string) => void;
    onClose: () => void;
}

export const BeneficioDetailsModal: React.FC<BeneficioDetailsModalProps> = ({
    beneficio,
    onSave,
    onDelete,
    onClose
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state for 6 editable fields
    const [formData, setFormData] = useState({
        dias_trabalhar: beneficio.dias_trabalhar ?? 0,
        dias_ausente: beneficio.dias_ausente ?? 0,
        valor_alimentacao_dia: beneficio.valor_alimentacao_dia ?? 0,
        valor_transporte_dia: beneficio.valor_transporte_dia ?? 0,
        valor_combustivel_dia: beneficio.valor_combustivel_dia ?? 0,
        valor_incentivo_mensal: beneficio.valor_incentivo_mensal ?? 0,
    });

    // Recálculo automático dos totais em tempo real
    const calculations = useMemo(() => {
        const diasTrab = Math.max(0, Number(formData.dias_trabalhar) || 0);
        const diasAus = Math.abs(Number(formData.dias_ausente) || 0);
        const totalDias = Math.max(0, diasTrab - diasAus);

        const valAlim = Math.max(0, Number(formData.valor_alimentacao_dia) || 0);
        const valTransp = Math.max(0, Number(formData.valor_transporte_dia) || 0);
        const valComb = Math.max(0, Number(formData.valor_combustivel_dia) || 0);
        const valInc = Math.max(0, Number(formData.valor_incentivo_mensal) || 0);

        const totalAlim = totalDias * valAlim;
        const totalTransp = totalDias * valTransp;
        const totalComb = totalDias * valComb;
        const totalGeral = totalAlim + totalTransp + totalComb + valInc;

        return {
            dias_trabalhar: diasTrab,
            dias_ausente: diasAus,
            total_dias: totalDias,
            valor_alimentacao_dia: valAlim,
            valor_transporte_dia: valTransp,
            valor_combustivel_dia: valComb,
            valor_incentivo_mensal: valInc,
            total_alimentacao: totalAlim,
            total_transporte: totalTransp,
            total_combustivel: totalComb,
            total_geral: totalGeral,
        };
    }, [formData]);

    const formatarMoeda = (valor: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave({
                id: beneficio.id,
                ...calculations
            });
            setIsEditing(false);
            onClose();
        } catch (error) {
            console.error('Erro ao atualizar benefício:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setFormData({
            dias_trabalhar: beneficio.dias_trabalhar ?? 0,
            dias_ausente: beneficio.dias_ausente ?? 0,
            valor_alimentacao_dia: beneficio.valor_alimentacao_dia ?? 0,
            valor_transporte_dia: beneficio.valor_transporte_dia ?? 0,
            valor_combustivel_dia: beneficio.valor_combustivel_dia ?? 0,
            valor_incentivo_mensal: beneficio.valor_incentivo_mensal ?? 0,
        });
        setIsEditing(false);
    };

    return (
        <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 text-blue-700 rounded-lg">
                        <User size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 text-base">{beneficio.funcionarios?.nome || 'N/A'}</h3>
                        <p className="text-xs text-gray-500">{beneficio.cargos_salarios?.cargo || '-'} • CPF: {beneficio.funcionarios?.cpf || '-'}</p>
                    </div>
                </div>
                <CompanyBadge company={beneficio.empresa} />
            </div>

            <div className="text-xs text-gray-500 flex items-center gap-2">
                <Building2 size={14} />
                <span>Posto: <strong className="text-gray-700">{beneficio.postos_trabalho?.nome || 'Não especificado'}</strong></span>
                <span>•</span>
                <span>Competência: <strong className="text-gray-700">{beneficio.competencia}</strong></span>
            </div>

            {!isEditing ? (
                /* MODO VISUALIZAÇÃO */
                <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                        <div>
                            <span className="text-xs text-blue-600 block">Dias a Trabalhar</span>
                            <span className="text-base font-semibold text-gray-900">{beneficio.dias_trabalhar}</span>
                        </div>
                        <div>
                            <span className="text-xs text-blue-600 block">Faltas / Ausências</span>
                            <span className="text-base font-semibold text-gray-900">{beneficio.dias_ausente}</span>
                        </div>
                        <div>
                            <span className="text-xs text-blue-600 block">Dias Efetivos</span>
                            <span className="text-base font-bold text-blue-700">{beneficio.total_dias}</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Composição dos Benefícios</h4>
                        <div className="bg-white border rounded-xl divide-y">
                            <div className="p-3 flex justify-between items-center text-sm">
                                <div>
                                    <span className="font-medium text-gray-800 block">Auxílio Alimentação</span>
                                    <span className="text-xs text-gray-400">{formatarMoeda(beneficio.valor_alimentacao_dia)} / dia</span>
                                </div>
                                <span className="font-semibold text-gray-900">{formatarMoeda(beneficio.total_alimentacao)}</span>
                            </div>
                            <div className="p-3 flex justify-between items-center text-sm">
                                <div>
                                    <span className="font-medium text-gray-800 block">Auxílio Transporte</span>
                                    <span className="text-xs text-gray-400">{formatarMoeda(beneficio.valor_transporte_dia)} / dia</span>
                                </div>
                                <span className="font-semibold text-gray-900">{formatarMoeda(beneficio.total_transporte)}</span>
                            </div>
                            <div className="p-3 flex justify-between items-center text-sm">
                                <div>
                                    <span className="font-medium text-gray-800 block">Auxílio Combustível</span>
                                    <span className="text-xs text-gray-400">{formatarMoeda(beneficio.valor_combustivel_dia)} / dia</span>
                                </div>
                                <span className="font-semibold text-gray-900">{formatarMoeda(beneficio.total_combustivel)}</span>
                            </div>
                            {beneficio.valor_incentivo_mensal > 0 && (
                                <div className="p-3 flex justify-between items-center text-sm">
                                    <span className="font-medium text-gray-800">Incentivo Mensal (Fixo)</span>
                                    <span className="font-semibold text-emerald-700">{formatarMoeda(beneficio.valor_incentivo_mensal)}</span>
                                </div>
                            )}
                            <div className="p-4 bg-gray-50 rounded-b-xl flex justify-between items-center font-bold text-base">
                                <span className="text-gray-900">Total Geral</span>
                                <span className="text-blue-600 text-lg">{formatarMoeda(beneficio.total_geral)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Botões do Rodapé em Modo Visualização */}
                    <div className="flex justify-between items-center pt-4 border-t gap-2">
                        <button
                            type="button"
                            onClick={() => onDelete(beneficio.id)}
                            className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 flex items-center gap-1.5 transition-colors"
                        >
                            <Trash2 size={16} />
                            Excluir Cálculo
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
                            >
                                Fechar
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                                <Edit2 size={16} />
                                Editar
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                /* MODO EDIÇÃO */
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg font-medium flex items-center justify-between">
                        <span>Edição ativa: altere os valores abaixo para recalcular o total em tempo real.</span>
                    </div>

                    {/* Seção de Dias */}
                    <div className="border rounded-xl p-4 bg-white space-y-3">
                        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar size={14} className="text-blue-600" /> Apontamento de Dias
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Dias a Trabalhar</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="31"
                                    value={formData.dias_trabalhar}
                                    onChange={(e) => setFormData({ ...formData, dias_trabalhar: Number(e.target.value) })}
                                    className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Dias Ausente / Faltas</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="31"
                                    value={formData.dias_ausente}
                                    onChange={(e) => setFormData({ ...formData, dias_ausente: Number(e.target.value) })}
                                    className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Total Dias Efetivos</label>
                                <div className="p-2 bg-gray-100 rounded-lg text-sm font-bold text-blue-700 border text-center">
                                    {calculations.total_dias} dias
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Seção de Valores Diários e Mensais */}
                    <div className="border rounded-xl p-4 bg-white space-y-3">
                        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign size={14} className="text-green-600" /> Valores Diários e Incentivo (R$)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Aux. Alimentação / dia</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.valor_alimentacao_dia}
                                    onChange={(e) => setFormData({ ...formData, valor_alimentacao_dia: Number(e.target.value) })}
                                    className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Aux. Transporte / dia</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.valor_transporte_dia}
                                    onChange={(e) => setFormData({ ...formData, valor_transporte_dia: Number(e.target.value) })}
                                    className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Aux. Combustível / dia</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.valor_combustivel_dia}
                                    onChange={(e) => setFormData({ ...formData, valor_combustivel_dia: Number(e.target.value) })}
                                    className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Incentivo Mensal (Fixo)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.valor_incentivo_mensal}
                                    onChange={(e) => setFormData({ ...formData, valor_incentivo_mensal: Number(e.target.value) })}
                                    className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Resumo de Recálculo em Tempo Real */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-2">
                        <div className="flex justify-between text-xs text-blue-900">
                            <span>Alimentação ({calculations.total_dias} x {formatarMoeda(calculations.valor_alimentacao_dia)}):</span>
                            <span className="font-semibold">{formatarMoeda(calculations.total_alimentacao)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-blue-900">
                            <span>Transporte ({calculations.total_dias} x {formatarMoeda(calculations.valor_transporte_dia)}):</span>
                            <span className="font-semibold">{formatarMoeda(calculations.total_transporte)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-blue-900">
                            <span>Combustível ({calculations.total_dias} x {formatarMoeda(calculations.valor_combustivel_dia)}):</span>
                            <span className="font-semibold">{formatarMoeda(calculations.total_combustivel)}</span>
                        </div>
                        {calculations.valor_incentivo_mensal > 0 && (
                            <div className="flex justify-between text-xs text-blue-900">
                                <span>Incentivo Mensal Fixo:</span>
                                <span className="font-semibold">{formatarMoeda(calculations.valor_incentivo_mensal)}</span>
                            </div>
                        )}
                        <div className="border-t border-blue-200 pt-2 flex justify-between items-center text-blue-950 font-bold text-base">
                            <span>Novo Total Geral Recalculado:</span>
                            <span className="text-blue-700 text-lg">{formatarMoeda(calculations.total_geral)}</span>
                        </div>
                    </div>

                    {/* Botões do Rodapé no Modo Edição */}
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
                        >
                            <Save size={16} />
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};
