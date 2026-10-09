import React, { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import PrimaryButton from '../../../components/PrimaryButton';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';
import { useModal } from '../../../context/ModalContext';
import { trocaPlantaoService } from '../services/trocaPlantaoService';
import { gerarRelatorioTrocaPlantaoPDF } from '../utils/relatorioTrocaPlantaoPDF';
import type { StatusTrocaPlantao } from '../types';

interface RelatorioTrocaPlantaoModalProps {
    onClose: () => void;
    defaultCompetencia?: string; // YYYY-MM
    defaultEmpresa?: 'FEMOG' | 'SEMOG' | '';
    defaultStatus?: string;
}

const STATUS_OPTIONS: StatusTrocaPlantao[] = [
    'Pendente',
    'Em Análise',
    'Autorizado',
    'Negado',
    'Cancelado',
];

const RelatorioTrocaPlantaoModal: React.FC<RelatorioTrocaPlantaoModalProps> = ({
    onClose,
    defaultCompetencia,
    defaultEmpresa = '',
    defaultStatus = 'Todas',
}) => {
    const { showFeedback } = useModal();
    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const initialDates = useMemo(() => {
        let year: number;
        let month: number;

        if (defaultCompetencia && defaultCompetencia.includes('-')) {
            const parts = defaultCompetencia.split('-');
            year = parseInt(parts[0], 10);
            month = parseInt(parts[1], 10);
        } else {
            const now = new Date();
            year = now.getFullYear();
            month = now.getMonth() + 1;
        }

        const lastDay = new Date(year, month, 0).getDate();
        const startStr = `${year}-${String(month).padStart(2, '0')}-01`;
        const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        return { startStr, endStr };
    }, [defaultCompetencia]);

    const [empresa, setEmpresa] = useState<'TODAS' | 'FEMOG' | 'SEMOG'>(
        defaultEmpresa === '' ? 'TODAS' : defaultEmpresa
    );
    const [status, setStatus] = useState<string>(
        defaultStatus === 'Todas' ? 'TODAS' : defaultStatus
    );
    const [dataInicio, setDataInicio] = useState<string>(initialDates.startStr);
    const [dataFim, setDataFim] = useState<string>(initialDates.endStr);

    const handleDownload = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!dataInicio || !dataFim) {
            setErrorMsg('Por favor, informe as datas de início e fim.');
            return;
        }

        if (dataInicio > dataFim) {
            setErrorMsg('A data de início não pode ser posterior à data final.');
            return;
        }

        try {
            setIsGenerating(true);

            const data = await trocaPlantaoService.getTrocasPlantaoRelatorio({
                empresa,
                dataInicio,
                dataFim,
                status,
            });

            if (!data || data.length === 0) {
                showFeedback('warning', 'Nenhuma solicitação de troca de plantão encontrada com os filtros selecionados.');
                setIsGenerating(false);
                return;
            }

            await gerarRelatorioTrocaPlantaoPDF(data, {
                empresa,
                dataInicio,
                dataFim,
                statusFiltro: status === 'TODAS' ? 'Todos' : status,
            });

            showFeedback('success', 'Relatório de trocas de plantão gerado com sucesso!');
            onClose();
        } catch (err: unknown) {
            console.error('Erro ao gerar relatório de trocas de plantão:', err);
            const msg = err instanceof Error ? err.message : 'Erro ao processar dados para o relatório.';
            showFeedback('error', msg);
            setErrorMsg(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    const empresaOptions = [
        { value: 'TODAS', label: 'Todas as Empresas' },
        { value: 'FEMOG', label: 'FEMOG' },
        { value: 'SEMOG', label: 'SEMOG' },
    ];

    const statusOptions = [
        { value: 'TODAS', label: 'Todos os Status' },
        ...STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
    ];

    return (
        <form onSubmit={handleDownload} className="space-y-4">
            {errorMsg && (
                <div className="p-3 text-sm rounded-lg bg-red-50 text-red-700 border border-red-200">
                    {errorMsg}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                    label="Empresa"
                    name="empresa"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value as any)}
                    options={empresaOptions}
                />

                <SelectField
                    label="Status da Troca"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    options={statusOptions}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                    label="Data Início"
                    name="dataInicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    required
                />

                <InputField
                    label="Data Fim"
                    name="dataFim"
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    required
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    disabled={isGenerating}
                >
                    Cancelar
                </button>
                <PrimaryButton
                    type="submit"
                    className="flex items-center gap-2"
                    disabled={isGenerating}
                >
                    {isGenerating ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            <span>Gerando PDF...</span>
                        </>
                    ) : (
                        <>
                            <Download size={18} />
                            <span>Baixar Relatório PDF</span>
                        </>
                    )}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default RelatorioTrocaPlantaoModal;
