import React, { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import PrimaryButton from '../../../components/PrimaryButton';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';
import { useFuncionarios } from '../../rh/hooks/useFuncionarios';
import { useModal } from '../../../context/ModalContext';
import { apontamentosService } from '../../../services/apontamentosService';
import { gerarRelatorioApontamentosPDF } from '../utils/relatorioApontamentosPDF';
import type { TipoApontamento } from '../types';

interface RelatorioApontamentosModalProps {
    onClose: () => void;
    defaultCompetencia?: string; // YYYY-MM
    defaultEmpresa?: 'TODOS' | 'FEMOG' | 'SEMOG';
}

const TIPOS_APONTAMENTO: TipoApontamento[] = [
    'Abono',
    'Ausência',
    'Atestado',
    'Curso',
    'Penalidade',
    'Troca Presença',
    'Troca Ausência',
];

const RelatorioApontamentosModal: React.FC<RelatorioApontamentosModalProps> = ({
    onClose,
    defaultCompetencia,
    defaultEmpresa = 'TODOS',
}) => {
    const { showFeedback } = useModal();
    const { funcionarios, isLoading: isLoadingFuncionarios } = useFuncionarios();
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
        defaultEmpresa === 'TODOS' ? 'TODAS' : defaultEmpresa
    );
    const [dataInicio, setDataInicio] = useState<string>(initialDates.startStr);
    const [dataFim, setDataFim] = useState<string>(initialDates.endStr);
    const [funcionarioId, setFuncionarioId] = useState<string>('TODOS');
    const [tipoApontamento, setTipoApontamento] = useState<string>('TODOS');

    const filteredFuncionarios = useMemo(() => {
        const list = funcionarios.filter((f) => {
            const matchesEmpresa = empresa === 'TODAS' || f.empresa === empresa;
            const matchesStatus = f.status === 'ativo';
            return matchesEmpresa && matchesStatus;
        });

        return list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    }, [funcionarios, empresa]);

    const handleEmpresaChange = (val: 'TODAS' | 'FEMOG' | 'SEMOG') => {
        setEmpresa(val);
        if (funcionarioId !== 'TODOS') {
            const currentSelected = funcionarios.find((f) => f.id === funcionarioId);
            if (currentSelected && val !== 'TODAS' && currentSelected.empresa !== val) {
                setFuncionarioId('TODOS');
            }
        }
    };

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

            const data = await apontamentosService.getApontamentosRelatorio({
                empresa,
                dataInicio,
                dataFim,
                funcionarioId,
                tipoApontamento,
            });

            if (!data || data.length === 0) {
                showFeedback('warning', 'Nenhum apontamento encontrado com os filtros selecionados.');
                setIsGenerating(false);
                return;
            }

            let funcNomeFiltro = 'Todos';
            if (funcionarioId !== 'TODOS') {
                const found = funcionarios.find((f) => f.id === funcionarioId);
                funcNomeFiltro = found?.nome || 'Específico';
            }

            await gerarRelatorioApontamentosPDF(data, {
                empresa,
                dataInicio,
                dataFim,
                funcionarioNomeFiltro: funcNomeFiltro,
                tipoApontamentoFiltro: tipoApontamento === 'TODOS' ? 'Todos' : tipoApontamento,
            });

            showFeedback('success', 'Relatório de apontamentos gerado com sucesso!');
            onClose();
        } catch (err: unknown) {
            console.error('Erro ao gerar relatório de apontamentos:', err);
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

    const funcionarioOptions = [
        {
            value: 'TODOS',
            label: empresa === 'TODAS' ? 'Todos os Funcionários' : `Todos os Funcionários da ${empresa}`,
        },
        ...filteredFuncionarios.map((f) => ({
            value: f.id,
            label: `${f.nome}${empresa === 'TODAS' ? ` (${f.empresa})` : ''}`,
        })),
    ];

    const tipoOptions = [
        { value: 'TODOS', label: 'Todos os Tipos' },
        ...TIPOS_APONTAMENTO.map((t) => ({ value: t, label: t })),
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
                    onChange={(e) => handleEmpresaChange(e.target.value as any)}
                    options={empresaOptions}
                />

                <SelectField
                    label="Tipo de Apontamento"
                    name="tipoApontamento"
                    value={tipoApontamento}
                    onChange={(e) => setTipoApontamento(e.target.value)}
                    options={tipoOptions}
                />
            </div>

            <SelectField
                label="Funcionário"
                name="funcionarioId"
                value={funcionarioId}
                onChange={(e) => setFuncionarioId(e.target.value)}
                options={funcionarioOptions}
                disabled={isLoadingFuncionarios}
            />

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

export default RelatorioApontamentosModal;
