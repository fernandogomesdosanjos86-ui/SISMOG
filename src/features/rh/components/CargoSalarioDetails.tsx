import React from 'react';
import type { CargoSalario } from '../types';
import { DollarSign, Percent, Clock, Coffee, Building2 } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { format } from 'date-fns';
import CompanyBadge from '../../../components/CompanyBadge';

interface CargoSalarioDetailsProps {
    cargo: CargoSalario;
}

const DetailCard = ({ label, value, icon: Icon, highlight = false }: any) => (
    <div className={`${highlight ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-gray-100'} p-4 rounded-xl border flex flex-col gap-2`}>
        <div className={`flex items-center text-sm font-medium mb-1 ${highlight ? 'text-blue-700' : 'text-gray-500'}`}>
            {Icon && <Icon size={16} className="mr-2" />} {label}
        </div>
        <div className={`${highlight ? 'text-blue-900' : 'text-gray-900'} font-semibold text-lg`}>{value}</div>
    </div>
);

const SectionHeader = ({ title, icon: Icon }: any) => (
    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm border-b pb-1 mt-6">
        {Icon && <Icon size={16} className="text-blue-500" />}
        {title}
    </h4>
);

const CargoSalarioDetails: React.FC<CargoSalarioDetailsProps> = ({ cargo }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between border-b border-gray-100 pb-5">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{cargo.cargo}</h3>
                    <p className="text-sm text-gray-500 mt-1">{cargo.uf}</p>
                </div>
                <CompanyBadge company={cargo.empresa} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailCard label="Salário Base" value={formatCurrency(cargo.salario_base)} icon={DollarSign} highlight />
                <DetailCard label="Empresa" value={cargo.empresa} icon={Building2} />
            </div>

            <SectionHeader title="Percentuais" icon={Percent} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <DetailCard label="Periculosidade" value={`${cargo.perc_periculosidade}%`} />
                <DetailCard label="Insalubridade" value={`${cargo.perc_insalubridade}%`} />
                <DetailCard label="Adc. Noturno" value={`${cargo.perc_adc_noturno}%`} />
                <DetailCard label="Intrajornada" value={`${cargo.perc_intrajornada}%`} />
            </div>

            <SectionHeader title="Auxílio Alimentação" icon={Coffee} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailCard label="Valor" value={formatCurrency(cargo.valor_aux_alim)} />
                <DetailCard label="Desconto" value={`${cargo.perc_desc_alim}%`} />
            </div>

            <SectionHeader title="Horas Extras" icon={Clock} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailCard label="Diurno" value={formatCurrency(cargo.valor_he_diurno)} />
                <DetailCard label="Noturno" value={formatCurrency(cargo.valor_he_noturno)} />
            </div>

            {(cargo as any).created_at && (
                <div className="text-xs text-gray-400 pt-4 text-center">
                    Registrado em {format(new Date((cargo as any).created_at), 'dd/MM/yyyy HH:mm')}
                </div>
            )}
        </div>
    );
};

export default CargoSalarioDetails;
