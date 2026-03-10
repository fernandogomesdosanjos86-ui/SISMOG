import React from 'react';
import type { Funcionario } from '../types';
import { Briefcase, FileText, Activity, Building, Hash, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import CompanyBadge from '../../../components/CompanyBadge';
import StatusBadge from '../../../components/StatusBadge';

interface FuncionarioDetailsProps {
    funcionario: Funcionario;
}

const FuncionarioDetails: React.FC<FuncionarioDetailsProps> = ({ funcionario }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{funcionario.nome}</h3>
                    <p className="text-sm text-gray-500 mt-1 font-mono">CPF: {funcionario.cpf}</p>
                </div>
                <CompanyBadge company={funcionario.empresa} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <Briefcase size={16} className="mr-2" /> Cargo
                    </div>
                    <div className="text-gray-900 font-semibold">{funcionario.cargos_salarios?.cargo || '-'}</div>
                    <div className="text-xs text-gray-500 font-mono">{funcionario.cargos_salarios?.uf || '-'}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <FileText size={16} className="mr-2" /> Contrato
                    </div>
                    <div className="text-gray-900 font-semibold">{funcionario.tipo_contrato || '-'}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <FileText size={16} className="mr-2" /> Uniforme
                    </div>
                    <div className="text-gray-900 font-semibold">{funcionario.uniforme || '-'}</div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <FileText size={16} className="mr-2" /> Valores Diários
                    </div>
                    <div className="text-xs text-gray-900">Transp: <span className="font-semibold">{funcionario.valor_transporte_dia ? funcionario.valor_transporte_dia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span></div>
                    <div className="text-xs text-gray-900">Combust: <span className="font-semibold">{funcionario.valor_combustivel_dia ? funcionario.valor_combustivel_dia.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span></div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center text-gray-500 text-sm font-medium mb-1">
                        <Activity size={16} className="mr-2" /> Status
                    </div>
                    <div className="mt-1">
                        <StatusBadge
                            active={funcionario.status === 'ativo'}
                            activeLabel="Ativo"
                            inactiveLabel="Inativo"
                        />
                    </div>
                </div>
            </div>

            <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm pb-1">
                    <Building size={16} className="text-blue-500" />
                    Dados Bancários
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col gap-2">
                        <div className="flex items-center text-blue-700 text-sm font-medium mb-1">
                            <Building size={16} className="mr-2" /> Banco
                        </div>
                        <div className="text-blue-900 font-semibold text-lg max-w-full truncate" title={funcionario.banco || ''}>{funcionario.banco || '-'}</div>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col gap-2">
                        <div className="flex items-center text-blue-700 text-sm font-medium mb-1">
                            <Hash size={16} className="mr-2" /> Agência/Conta
                        </div>
                        <div className="text-blue-900 font-semibold text-lg max-w-full truncate" title={`${funcionario.agencia || ''} / ${funcionario.conta || ''}`}>{funcionario.agencia || '-'} / {funcionario.conta || '-'}</div>
                    </div>
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col gap-2">
                        <div className="flex items-center text-blue-700 text-sm font-medium mb-1">
                            <Smartphone size={16} className="mr-2" /> PIX
                        </div>
                        <div className="text-blue-900 font-mono font-semibold text-lg max-w-full truncate" title={funcionario.pix || ''}>{funcionario.pix || '-'}</div>
                    </div>
                </div>
            </div>

            {funcionario.created_at && (
                <div className="text-xs text-gray-400 pt-4 text-center">
                    Registrado em {format(new Date(funcionario.created_at), 'dd/MM/yyyy HH:mm')}
                </div>
            )}
        </div>
    );
};

export default FuncionarioDetails;
