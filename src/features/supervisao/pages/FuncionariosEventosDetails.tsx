import React from 'react';
import { Star, Phone, CreditCard, User, AlertTriangle, CheckCircle } from 'lucide-react';
import type { FuncionarioEvento } from '../types';
interface FuncionariosEventosDetailsProps {
    funcionario: FuncionarioEvento;
}

const formatCPF = (cpf: string) => {
    if (!cpf) return '-';
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return cpf;
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const formatTelefone = (telefone: string) => {
    if (!telefone) return '-';
    const digits = telefone.replace(/\D/g, '');
    if (digits.length !== 11 && digits.length !== 10) return telefone;
    if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
};

const FuncionariosEventosDetails: React.FC<FuncionariosEventosDetailsProps> = ({ funcionario }) => {

    const isReciclagemEmDia = (dateStr: string) => {
        if (!dateStr) return false;
        return new Date(dateStr) > new Date();
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={14}
                        className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                ))}
            </div>
        );
    };

    const item = funcionario;
    const reciclagemOk = isReciclagemEmDia(item.validade_reciclagem);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{item.funcionario_nome}</h3>
                    <p className="text-sm text-gray-500 mt-1">Cadastro de Eventos</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'Apto' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.status}
                </div>
            </div>

            <div className="space-y-3">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <User size={16} className="text-gray-400" />
                                        <span className="font-semibold text-gray-700">Cargo:</span>
                                        <span>{item.cargo}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <CreditCard size={16} className="text-gray-400" />
                                        <span className="font-semibold text-gray-700">CPF:</span>
                                        <span>{formatCPF(item.cpf)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone size={16} className="text-gray-400" />
                                        <span className="font-semibold text-gray-700">Tel:</span>
                                        <span>{formatTelefone(item.telefone)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="font-semibold text-gray-700">PIX:</span>
                                        <span>{item.pix || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm mt-1">
                                        <span className="font-semibold text-gray-700">Avaliação:</span>
                                        {renderStars(item.avaliacao)}
                                    </div>
                                </div>

                                <div className="space-y-2 border-l pl-4 md:border-t-0 border-t md:pt-0 pt-4">
                                    <div className="text-sm">
                                        <span className="font-semibold text-gray-700">Grandes Eventos: </span>
                                        <span className={item.grandes_eventos ? 'text-green-600 font-bold' : 'text-gray-500'}>
                                            {item.grandes_eventos ? 'SIM' : 'NÃO'}
                                        </span>
                                    </div>

                                    <div className="text-sm mt-2">
                                        <span className="font-semibold text-gray-700 block mb-1">Reciclagem:</span>
                                        {item.validade_reciclagem ? (
                                            <div className="flex items-center gap-1">
                                                {reciclagemOk ? <CheckCircle size={14} className="text-green-500" /> : <AlertTriangle size={14} className="text-red-500" />}
                                                <span className={reciclagemOk ? 'text-green-700' : 'text-red-700 font-bold'}>
                                                    {new Date(item.validade_reciclagem + 'T12:00:00').toLocaleDateString('pt-BR')} ({reciclagemOk ? 'Em dia' : 'Vencida'})
                                                </span>
                                            </div>
                                        ) : <span className="text-gray-500">Não informada</span>}
                                    </div>

                                    <div className="text-sm mt-2">
                                        <span className="font-semibold text-gray-700 block mb-1">CNV:</span>
                                        {item.numero_cnv ? (
                                            <div>
                                                <span>{item.numero_cnv}</span>
                                                {item.validade_cnv && (
                                                    <span className="text-gray-500 text-xs ml-2">
                                                        Val: {new Date(item.validade_cnv + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                    </span>
                                                )}
                                            </div>
                                        ) : <span className="text-gray-500">Não informada</span>}
                                    </div>
                                </div>
                            </div>

                            {item.observacoes && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                                    <span className="font-semibold text-gray-600 block mb-1">Observações:</span>
                                    {item.observacoes}
                                </div>
                            )}

                        </div>
            </div>
        </div>
    );
};

export default FuncionariosEventosDetails;
