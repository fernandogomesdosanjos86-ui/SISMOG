import { useState, useEffect, type FC, type FormEvent, type ChangeEvent } from 'react';

import type { Contrato } from '../types';
import { financeiroService } from '../../../services/financeiroService';
import { useModal } from '../../../context/ModalContext';

interface ContratoFormProps {
    initialData?: Contrato;
    onSuccess?: () => void;
}

const ContratoForm: FC<ContratoFormProps> = ({ initialData, onSuccess }) => {

    const { closeModal, showFeedback } = useModal();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Contrato>>({
        empresa: 'SEMOG',
        contratante: '',
        nome_posto: '',
        data_inicio: '',
        duracao_meses: 12,
        valor_mensal: 0,
        dia_faturamento: 25,
        dia_vencimento: 5,
        vencimento_mes_corrente: false,
        perc_iss: 0,
        retencao_iss: false,
        retencao_pis: false,
        retencao_cofins: false,
        retencao_irpj: false,
        retencao_csll: false,
        retencao_inss: false,
        tem_retencao_caucao: false,
        perc_retencao_caucao: 0,
        status: 'ativo'
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        }
    }, [initialData]);

    const calculateTermino = () => {
        if (!formData.data_inicio || !formData.duracao_meses) return '-';
        const date = new Date(formData.data_inicio);
        date.setMonth(date.getMonth() + formData.duracao_meses);
        return date.toLocaleDateString('pt-BR');
    };

    const handleSubmit = async (e: FormEvent) => {

        e.preventDefault();
        setLoading(true);
        try {
            if (initialData?.id) {
                await financeiroService.updateContrato(initialData.id, formData);
                showFeedback('success', 'Contrato atualizado com sucesso!');
            } else {
                await financeiroService.createContrato(formData as Contrato);
                showFeedback('success', 'Contrato criado com sucesso!');
            }
            onSuccess?.();
            closeModal();
        } catch (error) {
            console.error(error);
            showFeedback('error', `Erro ao salvar contrato: ${(error as any).message || 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {

        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked :
                type === 'number' ? parseFloat(value) : value
        }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Info */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Empresa</label>
                    <select name="empresa" value={formData.empresa} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border">
                        <option value="SEMOG">SEMOG</option>
                        <option value="FEMOG">FEMOG</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Contratante</label>
                    <input required name="contratante" value={formData.contratante} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Posto/Serviço</label>
                    <input required name="nome_posto" value={formData.nome_posto} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border">
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                    </select>
                </div>

                {/* Dates & Values */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Data Início</label>
                    <input type="date" required name="data_inicio" value={formData.data_inicio} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Duração (meses)</label>
                    <input type="number" required name="duracao_meses" value={formData.duracao_meses} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                    <p className="text-xs text-gray-500 mt-1">Término previsto: {calculateTermino()}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Valor Mensal (R$)</label>
                    <input type="number" step="0.01" required name="valor_mensal" value={formData.valor_mensal} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
            </div>

            <div className="border-t pt-4">
                <h3 className="tex-sm font-medium text-gray-900 mb-2">Faturamento e Vencimento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Dia Faturamento</label>
                        <input type="number" min="1" max="31" required name="dia_faturamento" value={formData.dia_faturamento} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Dia Vencimento</label>
                        <input type="number" min="1" max="31" required name="dia_vencimento" value={formData.dia_vencimento} onChange={handleChange} className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                    </div>
                    <div className="flex items-center mt-6">
                        <input type="checkbox" name="vencimento_mes_corrente" checked={formData.vencimento_mes_corrente} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded" />
                        <label className="ml-2 block text-sm text-gray-700">Vence no mesmo mês?</label>
                    </div>
                </div>
            </div>

            <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Retenções e Impostos</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Percentual ISS (%)</label>
                        <input
                            type="number"
                            step="0.01"
                            name="perc_iss"
                            value={formData.perc_iss}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="flex items-center mt-6">
                        <input type="checkbox" name="retencao_iss" checked={formData.retencao_iss} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded" />
                        <label className="ml-2 block text-sm text-gray-700">Reter ISS na fonte?</label>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center">
                        <input type="checkbox" name="retencao_pis" checked={formData.retencao_pis} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded" />
                        <label className="ml-2 block text-sm text-gray-700">PIS (0,65%)</label>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="retencao_cofins" checked={formData.retencao_cofins} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded" />
                        <label className="ml-2 block text-sm text-gray-700">COFINS (3%)</label>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="retencao_irpj" checked={formData.retencao_irpj} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded" />
                        <label className="ml-2 block text-sm text-gray-700">IRPJ (1%)</label>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="retencao_csll" checked={formData.retencao_csll} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded" />
                        <label className="ml-2 block text-sm text-gray-700">CSLL (1%)</label>
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="retencao_inss" checked={formData.retencao_inss} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded" />
                        <label className="ml-2 block text-sm text-gray-700">INSS (11%)</label>
                    </div>
                </div>

                <div className="mt-4">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" name="tem_retencao_caucao" checked={formData.tem_retencao_caucao} onChange={handleChange} className="h-4 w-4 text-blue-600 rounded" />
                        <label className="block text-sm text-gray-700 w-24">Caução?</label>
                        <input
                            type="number" step="0.01"
                            name="perc_retencao_caucao"
                            disabled={!formData.tem_retencao_caucao}
                            value={formData.perc_retencao_caucao} onChange={handleChange}
                            placeholder="%"
                            className="w-20 rounded-md border-gray-300 shadow-sm p-1 border"
                        />
                        <span className="text-sm text-gray-500">%</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    {loading ? 'Salvando...' : 'Salvar Contrato'}
                </button>
            </div>
        </form>
    );
};

export default ContratoForm;
