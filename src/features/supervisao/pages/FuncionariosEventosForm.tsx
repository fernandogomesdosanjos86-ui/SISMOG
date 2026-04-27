import React, { useState } from 'react';
import PrimaryButton from '../../../components/PrimaryButton';
import { useModal } from '../../../context/ModalContext';
import { SelectField } from '../../../components/forms/SelectField';
import { InputField } from '../../../components/forms/InputField';
import { MaskedInputField } from '../../../components/forms/MaskedInputField';
import type { FuncionarioEventoFormData, CargoEvento, StatusEvento, FuncionarioEvento } from '../types';

interface FuncionariosEventosFormProps {
    initialData?: FuncionarioEvento;
    onSuccess: () => void;
    create: (data: FuncionarioEventoFormData) => Promise<any>;
    update: (id: string, data: Partial<FuncionarioEventoFormData>) => Promise<any>;
}

const FuncionariosEventosForm: React.FC<FuncionariosEventosFormProps> = ({ initialData, onSuccess, create, update }) => {
    const { showFeedback } = useModal();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [data, setData] = useState(initialData?.data || new Date().toISOString().substring(0, 10));
    const [funcionario_nome, setFuncionarioNome] = useState(initialData?.funcionario_nome || '');
    const [cpf, setCpf] = useState(initialData?.cpf || '');
    const [telefone, setTelefone] = useState(initialData?.telefone || '');
    const [pix, setPix] = useState(initialData?.pix || '');
    const [cargo, setCargo] = useState<CargoEvento | ''>(initialData?.cargo || '');
    const [grandes_eventos, setGrandesEventos] = useState<boolean>(initialData?.grandes_eventos || false);
    const [validade_reciclagem, setValidadeReciclagem] = useState(initialData?.validade_reciclagem || '');
    const [numero_cnv, setNumeroCnv] = useState(initialData?.numero_cnv || '');
    const [validade_cnv, setValidadeCnv] = useState(initialData?.validade_cnv || '');
    const [status, setStatus] = useState<StatusEvento | ''>(initialData?.status || 'Apto');
    const [avaliacao, setAvaliacao] = useState<number>(initialData?.avaliacao || 5);
    const [observacoes, setObservacoes] = useState(initialData?.observacoes || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!data || !funcionario_nome || !cargo || !status) {
            showFeedback('error', 'Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const payload: FuncionarioEventoFormData = {
            data,
            funcionario_nome,
            cpf,
            telefone,
            pix,
            cargo,
            grandes_eventos,
            validade_reciclagem,
            numero_cnv,
            validade_cnv,
            status,
            avaliacao,
            observacoes
        } as any;

        try {
            setIsSubmitting(true);
            if (initialData) {
                await update(initialData.id, payload);
                showFeedback('success', 'Registro atualizado com sucesso!');
            } else {
                await create(payload);
                showFeedback('success', 'Registro criado com sucesso!');
            }
            onSuccess();
        } catch (error) {
            console.error(error);
            showFeedback('error', 'Erro ao salvar registro.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                    label="Nome do Funcionário"
                    type="text"
                    value={funcionario_nome}
                    onChange={(e) => setFuncionarioNome(e.target.value.toUpperCase())}
                    required
                />
                <InputField
                    label="Data"
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MaskedInputField
                    label="CPF"
                    name="cpf"
                    mask="999.999.999-99"
                    value={cpf}
                    onChange={(e: any) => setCpf(e.target.value.replace(/\D/g, ''))}
                />
                <MaskedInputField
                    label="Telefone"
                    name="telefone"
                    mask="(99) 99999-9999"
                    value={telefone}
                    onChange={(e: any) => setTelefone(e.target.value.replace(/\D/g, ''))}
                />
                <InputField
                    label="PIX"
                    type="text"
                    value={pix}
                    onChange={(e) => setPix(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                    label="Cargo"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value as any)}
                    options={[
                        { value: 'Vigilante', label: 'Vigilante' },
                        { value: 'Supervisor', label: 'Supervisor' },
                        { value: 'Apoio', label: 'Apoio' },
                        { value: 'Outro', label: 'Outro' }
                    ]}
                    required
                />
                <div className="flex items-center mt-6">
                    <input
                        type="checkbox"
                        id="grandes_eventos"
                        checked={grandes_eventos}
                        onChange={(e) => setGrandesEventos(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="grandes_eventos" className="ml-2 text-sm font-semibold text-gray-700">
                        Grandes Eventos
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                <InputField
                    label="Validade Reciclagem"
                    type="date"
                    value={validade_reciclagem}
                    onChange={(e) => setValidadeReciclagem(e.target.value)}
                />
                <InputField
                    label="Número CNV"
                    type="text"
                    value={numero_cnv}
                    onChange={(e) => setNumeroCnv(e.target.value)}
                />
                <InputField
                    label="Validade CNV"
                    type="date"
                    value={validade_cnv}
                    onChange={(e) => setValidadeCnv(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <SelectField
                    label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    options={[
                        { value: 'Apto', label: 'Apto' },
                        { value: 'Inapto', label: 'Inapto' }
                    ]}
                    required
                />
                <div className="flex flex-col space-y-1">
                    <label className="text-sm font-semibold text-gray-700">Avaliação (1 a 5 estrelas)</label>
                    <input
                        type="number"
                        min="1"
                        max="5"
                        value={avaliacao}
                        onChange={(e) => setAvaliacao(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
            </div>

            <div className="flex flex-col space-y-1">
                <label className="text-sm font-semibold text-gray-700">Observações</label>
                <textarea
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                />
            </div>

            <div className="flex justify-end pt-4">
                <PrimaryButton type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Salvar'}
                </PrimaryButton>
            </div>
        </form>
    );
};

export default FuncionariosEventosForm;
