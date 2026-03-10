import React, { useState } from 'react';

interface GerarBeneficiosModalProps {
    onClose: () => void;
    onGenerate: (competencia: string, empresa: 'FEMOG' | 'SEMOG') => Promise<void>;
}

const GerarBeneficiosModal: React.FC<GerarBeneficiosModalProps> = ({ onClose, onGenerate }) => {
    // Competência default é o mês atual (YYYY-MM)
    const [competencia, setCompetencia] = useState(new Date().toISOString().substring(0, 7));
    const [empresa, setEmpresa] = useState<'FEMOG' | 'SEMOG'>('FEMOG');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Verifica se competencia é preenchida
        if (!competencia) {
            alert('A competência deve ser selecionada');
            return;
        }

        try {
            setIsGenerating(true);
            await onGenerate(competencia, empresa);
            onClose();
        } catch (error) {
            console.error('Erro ao gerar:', error);
            alert(error instanceof Error ? error.message : 'Erro ao gerar os benefícios.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                <select
                    required
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value as 'FEMOG' | 'SEMOG')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="FEMOG">FEMOG</option>
                    <option value="SEMOG">SEMOG</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Competência</label>
                <input
                    type="month"
                    required
                    value={competencia}
                    onChange={(e) => setCompetencia(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
            </div>

            <p className="text-xs text-gray-500">
                A geração processa todos os dias trabalhados e faltas dos funcionários ativos sem horas extras na empresa e competência informada. Esta ação leva apenas valores inéditos, e descarta os que já constam do banco na competência solicitada.
            </p>

            <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                    disabled={isGenerating}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center justify-center disabled:opacity-50"
                    disabled={isGenerating}
                >
                    {isGenerating ? 'Processando...' : 'Gerar Benefícios'}
                </button>
            </div>
        </form>
    );
};

export default GerarBeneficiosModal;
