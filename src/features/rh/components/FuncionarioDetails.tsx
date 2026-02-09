import React from 'react';
import type { Funcionario } from '../types';
import CompanyBadge from '../../../components/CompanyBadge';
import StatusBadge from '../../../components/StatusBadge';

interface FuncionarioDetailsProps {
    funcionario: Funcionario;
}

const FuncionarioDetails: React.FC<FuncionarioDetailsProps> = ({ funcionario }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{funcionario.nome}</h3>
                    <p className="text-sm text-gray-500">CPF: {funcionario.cpf}</p>
                </div>
                <CompanyBadge company={funcionario.empresa} />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <p className="text-sm font-medium text-gray-500">Cargo</p>
                    <p className="text-gray-900 font-medium">
                        {funcionario.cargos_salarios?.cargo || '-'}
                    </p>
                    <p className="text-xs text-gray-400">
                        {funcionario.cargos_salarios?.uf || '-'}
                    </p>
                </div>

                <div>
                    <p className="text-sm font-medium text-gray-500">Tipo de Contrato</p>
                    <p className="text-gray-900">{funcionario.tipo_contrato || '-'}</p>
                </div>

                <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
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
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Dados Bancários</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Banco</p>
                        <p className="text-gray-900">{funcionario.banco || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Agência / Conta</p>
                        <p className="text-gray-900">
                            {funcionario.agencia || '-'} / {funcionario.conta || '-'}
                        </p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-sm font-medium text-gray-500">Chave PIX</p>
                        <p className="text-gray-900 font-mono">{funcionario.pix || '-'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FuncionarioDetails;
