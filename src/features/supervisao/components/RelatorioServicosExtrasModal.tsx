import React, { useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import PrimaryButton from '../../../components/PrimaryButton';
import { InputField } from '../../../components/forms/InputField';
import { SelectField } from '../../../components/forms/SelectField';
import { useFuncionarios } from '../../rh/hooks/useFuncionarios';
import { useModal } from '../../../context/ModalContext';
import { servicosExtrasService } from '../../../services/servicosExtrasService';
import { gerarRelatorioServicosExtrasPDF } from '../utils/relatorioServicosExtrasPDF';

interface RelatorioServicosExtrasModalProps {
    onClose: () => void;
    defaultCompetencia?: string; // YYYY-MM
    defaultEmpresa?: 'TODOS' | 'FEMOG' | 'SEMOG';
}

const RelatorioServicosExtrasModal: React.FC<RelatorioServicosExtrasModalProps> = ({
    onClose,
    defaultCompetencia,
    defaultEmpresa = 'TODOS',
}) => {
    const { showFeedback } = useModal();
    const { funcionarios, isLoading: isLoadingFuncionarios } = useFuncionarios();
    const [isGenerating, setIsGenerating] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Initial dates based on competence or current date
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

    // Form states
    const [empresa, setEmpresa] = useState<'TODAS' | 'FEMOG' | 'SEMOG'>(
        defaultEmpresa === 'TODOS' ? 'TODAS' : defaultEmpresa
    );
    const [dataInicio, setDataInicio] = useState<string>(initialDates.startStr);
    const [dataFim, setDataFim] = useState<string>(initialDates.endStr);
    const [funcionarioId, setFuncionarioId] = useState<string>('TODOS');

    // Filter employees dynamically by selected company
    const filteredFuncionarios = useMemo(() => {
        const list = funcionarios.filter((f) => {
            const matchesEmpresa = empresa === 'TODAS' || f.empresa === empresa;
            const matchesStatus = f.status === 'ativo';
            return matchesEmpresa && matchesStatus;
        });

        return list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    }, [funcionarios, empresa]);

    // Reset employee if company change excludes the selected employee
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

            // 1. Fetch data for report
            const data = await servicosExtrasService.getServicosRelatorio({
                empresa,
                dataInicio,
                dataFim,
                funcionarioId,
            });

            if (!data || data.length === 0) {
                showFeedback('warning', 'Nenhum serviço extra encontrado com os filtros selecionados.');
                setIsGenerating(false);
                return;
            }

            // 2. Identify employee name if specific
            let funcNomeFiltro = 'Todos';
            if (funcionarioId !== 'TODOS') {
                const found = funcionarios.find((f) => f.id === funcionarioId);
                funcNomeFiltro = found?.nome || 'Específico';
            }

            // 3. Generate & Download PDF
            await gerarRelatorioServicosExtrasPDF(data, {
                empresa,
                dataInicio,
                dataFim,
                funcionarioNomeFiltro: funcNomeFiltro,
            });

            showFeedback('success', 'Relatório gerado e baixado com sucesso!');
            onClose();
        } catch (err: unknown) {
            console.error('Erro ao gerar relatório de serviços extras:', err);
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

    return (
        <form onSubmit={handleDownload} className="space-y-6">
            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">
                    {errorMsg}
                </div>
            )}

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                    label="Empresa"
                    value={empresa}
                    onChange={(e) => handleEmpresaChange(e.target.value as 'TODAS' | 'FEMOG' | 'SEMOG')}
                    options={empresaOptions}
                    disabled={isGenerating}
                />

                <SelectField
                    label="Funcionário"
                    value={funcionarioId}
                    onChange={(e) => setFuncionarioId(e.target.value)}
                    options={funcionarioOptions}
                    disabled={isGenerating || isLoadingFuncionarios}
                />

                <InputField
                    label="Data de Início"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    required
                    disabled={isGenerating}
                />

                <InputField
                    label="Data Final"
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    required
                    disabled={isGenerating}
                />
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isGenerating}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    Cancelar
                </button>
                <PrimaryButton
                    type="submit"
                    disabled={isGenerating}
                    icon={<Download size={18} />}
                    className="min-w-[140px]"
                >
                    {isGenerating ? 'Gerando PDF...' : 'Baixar PDF'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default RelatorioServicosExtrasModal;
