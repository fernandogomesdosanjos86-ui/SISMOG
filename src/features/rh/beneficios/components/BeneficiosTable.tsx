import React from 'react';
import ResponsiveTable from '../../../../components/ResponsiveTable';
import CompanyBadge from '../../../../components/CompanyBadge';
import { useModal } from '../../../../context/ModalContext';
import type { BeneficioCalculado } from '../types';

interface BeneficiosTableProps {
    data: BeneficioCalculado[];
    isLoading: boolean;
    onDelete: (id: string) => void;
    page: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}

const BeneficiosTable: React.FC<BeneficiosTableProps> = ({
    data,
    isLoading,
    onDelete,
    page,
    itemsPerPage,
    onPageChange
}) => {
    const { openViewModal } = useModal();
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = data.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const formatarMoeda = (valor: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    const renderDetails = (i: BeneficioCalculado) => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <span className="text-gray-500 text-xs block">Nome</span>
                    <span className="font-medium text-gray-900">{i.funcionarios?.nome}</span>
                </div>
                <div>
                    <span className="text-gray-500 text-xs block">CPF</span>
                    <span className="text-gray-900">{i.funcionarios?.cpf || '-'}</span>
                </div>
                <div>
                    <span className="text-gray-500 text-xs block">Cargo</span>
                    <span className="text-gray-900">{i.cargos_salarios?.cargo || '-'}</span>
                </div>
                <div>
                    <span className="text-gray-500 text-xs block">Posto</span>
                    <span className="text-gray-900">{i.postos_trabalho?.nome || '-'}</span>
                </div>
                <div>
                    <span className="text-gray-500 text-xs block">Dias (Trab / Ausente)</span>
                    <span className="text-gray-900">{i.total_dias} ({i.dias_trabalhar} / {i.dias_ausente})</span>
                </div>
                <div>
                    <span className="text-gray-500 text-xs block">Empresa</span>
                    <CompanyBadge company={i.empresa} />
                </div>
            </div>

            <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Composição do Benefício</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between text-sm items-center border-b border-gray-100 pb-2">
                        <div className="flex flex-col">
                            <span className="text-gray-600 font-medium">Auxílio Alimentação</span>
                            <span className="text-xs text-gray-400">{formatarMoeda(i.valor_alimentacao_dia)} / dia</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatarMoeda(i.total_alimentacao)}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center border-b border-gray-100 pb-2">
                        <div className="flex flex-col">
                            <span className="text-gray-600 font-medium">Auxílio Transporte</span>
                            <span className="text-xs text-gray-400">{formatarMoeda(i.valor_transporte_dia)} / dia</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatarMoeda(i.total_transporte)}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center border-b border-gray-100 pb-2">
                        <div className="flex flex-col">
                            <span className="text-gray-600 font-medium">Auxílio Combustível</span>
                            <span className="text-xs text-gray-400">{formatarMoeda(i.valor_combustivel_dia)} / dia</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatarMoeda(i.total_combustivel)}</span>
                    </div>
                    {i.valor_incentivo_mensal > 0 && (
                        <div className="flex justify-between text-sm items-center border-b border-gray-100 pb-2">
                            <span className="text-gray-600 font-medium">Incentivo Mensal (Fixo)</span>
                            <span className="font-medium text-gray-900">{formatarMoeda(i.valor_incentivo_mensal)}</span>
                        </div>
                    )}
                    <div className="pt-2 flex justify-between font-bold text-gray-900 text-base">
                        <span>Total Geral</span>
                        <span className="text-blue-600">{formatarMoeda(i.total_geral)}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const handleRowClick = (i: BeneficioCalculado) => {
        openViewModal(
            'Detalhes dos Benefícios',
            renderDetails(i),
            {
                canEdit: false,
                canDelete: true,
                onDelete: () => onDelete(i.id),
                deleteText: 'Excluir Cálculo'
            }
        );
    };

    const columns = [
        {
            key: 'funcionario',
            header: 'Funcionário / Cargo',
            render: (i: BeneficioCalculado) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{i.funcionarios?.nome || 'N/A'}</span>
                    <span className="text-xs text-gray-500">{i.cargos_salarios?.cargo || '-'}</span>
                </div>
            )
        },
        {
            key: 'posto',
            header: 'Posto',
            render: (i: BeneficioCalculado) => (
                <span className="text-sm text-gray-600 truncate max-w-[200px] block" title={i.postos_trabalho?.nome}>
                    {i.postos_trabalho?.nome || '-'}
                </span>
            )
        },
        {
            key: 'empresa',
            header: 'Empresa',
            render: (i: BeneficioCalculado) => <CompanyBadge company={i.empresa} />
        },
        {
            key: 'dias',
            header: 'Dias',
            render: (i: BeneficioCalculado) => (
                <span className="text-sm font-medium">
                    {i.total_dias} <span className="text-xs text-gray-500 font-normal">({i.dias_trabalhar} Trab / {i.dias_ausente} Aus)</span>
                </span>
            )
        },
        {
            key: 'totais',
            header: 'Valor Auxílio',
            render: (i: BeneficioCalculado) => (
                <div className="flex flex-col text-sm w-36">
                    <span className="text-gray-900">Alim.: {formatarMoeda(i.total_alimentacao)}</span>
                    <span className="text-gray-900">Transp.: {formatarMoeda(i.total_transporte)}</span>
                    <span className="text-gray-900">Comb.: {formatarMoeda(i.total_combustivel)}</span>
                    {i.valor_incentivo_mensal > 0 && (
                        <span className="text-emerald-700">Inc.: {formatarMoeda(i.valor_incentivo_mensal)}</span>
                    )}
                </div>
            )
        },
        {
            key: 'total_geral',
            header: 'Total Geral',
            render: (i: BeneficioCalculado) => (
                <span className="font-bold text-gray-900">{formatarMoeda(i.total_geral)}</span>
            )
        }
    ];

    const renderCard = (i: BeneficioCalculado) => (
        <div className={`flex flex-col gap-2 relative border-l-4 pl-3 ${i.empresa === 'FEMOG' ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-gray-900">{i.funcionarios?.nome}</h3>
                    <p className="text-xs text-gray-500">{i.cargos_salarios?.cargo || '-'}</p>
                    <p className="text-xs text-blue-600 font-medium mt-1">{i.postos_trabalho?.nome || 'N/A'}</p>
                </div>
                <CompanyBadge company={i.empresa} />
            </div>

            <div className="flex justify-between items-center text-sm mt-2 border-b pb-2">
                <div>
                    <span className="text-gray-500 block text-xs">Dias Calculados</span>
                    <span className="font-medium">{i.total_dias} <span className="text-xs font-normal text-gray-400">({i.dias_trabalhar}/{i.dias_ausente})</span></span>
                </div>
                <div className="text-right">
                    <span className="text-gray-500 block text-xs">Total Geral</span>
                    <span className="font-bold text-green-600">{formatarMoeda(i.total_geral)}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                <div>
                    <span className="text-gray-500 block text-xs">Alim.</span>
                    <span className="font-medium">{formatarMoeda(i.total_alimentacao)}</span>
                </div>
                <div>
                    <span className="text-gray-500 block text-xs">Transp/Comb</span>
                    <span className="font-medium">{formatarMoeda(i.total_transporte + i.total_combustivel)}</span>
                </div>
                {i.valor_incentivo_mensal > 0 && (
                    <div>
                        <span className="text-gray-500 block text-xs">Incentivo</span>
                        <span className="font-medium text-emerald-700">{formatarMoeda(i.valor_incentivo_mensal)}</span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div>
            <ResponsiveTable<BeneficioCalculado>
                data={paginatedData}
                columns={columns}
                onRowClick={handleRowClick}
                emptyMessage="Nenhum benefício encontrado para esta competência."
                renderCard={renderCard}
                keyExtractor={(item) => item.id}
                loading={isLoading}
                getRowBorderColor={(item) => item.empresa === 'FEMOG' ? 'border-blue-500' : 'border-orange-500'}
            />

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 py-4">
                    <button
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                        Página {page} de {totalPages}
                    </span>
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Próxima
                    </button>
                </div>
            )}
        </div>
    );
};

export default BeneficiosTable;

