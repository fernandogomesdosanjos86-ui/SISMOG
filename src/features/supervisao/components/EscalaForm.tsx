import React, { useState } from 'react';
import { usePostos } from '../hooks/usePostos';
import PrimaryButton from '../../../components/PrimaryButton';

interface EscalaFormProps {
    onSubmit: (competencia: string, empresa: 'FEMOG' | 'SEMOG', postoId: string) => void;
    onCancel: () => void;
}

const EscalaForm: React.FC<EscalaFormProps> = ({ onSubmit, onCancel }) => {
    const [competencia, setCompetencia] = useState(new Date().toISOString().substring(0, 7));
    const [empresa, setEmpresa] = useState<'FEMOG' | 'SEMOG'>('FEMOG');
    const [postoId, setPostoId] = useState('');

    const { postos } = usePostos();
    const filteredPostos = postos.filter(p => p.empresa === empresa);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!postoId) return;
        onSubmit(competencia, empresa, postoId);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Competência</label>
                        <input
                            type="month"
                            value={competencia}
                            onChange={(e) => setCompetencia(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                        <select
                            value={empresa}
                            onChange={(e) => {
                                setEmpresa(e.target.value as 'FEMOG' | 'SEMOG');
                                setPostoId('');
                            }}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="FEMOG">FEMOG</option>
                            <option value="SEMOG">SEMOG</option>
                        </select>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Posto de Trabalho</label>
                        <select
                            value={postoId}
                            onChange={(e) => setPostoId(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        >
                            <option value="" disabled>Selecione um posto...</option>
                            {filteredPostos.map(posto => (
                                <option key={posto.id} value={posto.id}>{posto.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancelar
                </button>
                <PrimaryButton type="submit" disabled={!postoId}>
                    Gerar Escala Inicial
                </PrimaryButton>
            </div>
        </form>
    );
};

export default EscalaForm;
