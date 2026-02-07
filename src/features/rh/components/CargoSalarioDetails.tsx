import React from 'react';
import type { CargoSalario } from '../types';
import { formatCurrency } from '../../../utils/format';
import CompanyBadge from '../../../components/CompanyBadge';

interface CargoSalarioDetailsProps {
    cargo: CargoSalario;
}

const DetailRow = ({ label, value }: { label: string; value: string | number }) => (
    <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-gray-900 font-medium">{value}</p>
    </div>
);

const SectionHeader = ({ title }: { title: string }) => (
    <h4 className="text-sm font-medium text-gray-900 mb-3">{title}</h4>
);

const CargoSalarioDetails: React.FC<CargoSalarioDetailsProps> = ({ cargo }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{cargo.cargo}</h3>
                    <p className="text-sm text-gray-500">{cargo.uf}</p>
                </div>
                <CompanyBadge company={cargo.empresa} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Salário Base" value={formatCurrency(cargo.salario_base)} />
                <DetailRow label="Empresa" value={cargo.empresa} />
            </div>

            <div className="border-t pt-4">
                <SectionHeader title="Percentuais" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <DetailRow label="Periculosidade" value={`${cargo.perc_periculosidade}%`} />
                    <DetailRow label="Insalubridade" value={`${cargo.perc_insalubridade}%`} />
                    <DetailRow label="Adc. Noturno" value={`${cargo.perc_adc_noturno}%`} />
                    <DetailRow label="Intrajornada" value={`${cargo.perc_intrajornada}%`} />
                </div>
            </div>

            <div className="border-t pt-4">
                <SectionHeader title="Auxílio Alimentação" />
                <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="Valor Auxílio" value={formatCurrency(cargo.valor_aux_alim)} />
                    <DetailRow label="Desconto" value={`${cargo.perc_desc_alim}%`} />
                </div>
            </div>

            <div className="border-t pt-4">
                <SectionHeader title="Horas Extras" />
                <div className="grid grid-cols-2 gap-4">
                    <DetailRow label="HE Diurno" value={formatCurrency(cargo.valor_he_diurno)} />
                    <DetailRow label="HE Noturno" value={formatCurrency(cargo.valor_he_noturno)} />
                </div>
            </div>
        </div>
    );
};

export default CargoSalarioDetails;
