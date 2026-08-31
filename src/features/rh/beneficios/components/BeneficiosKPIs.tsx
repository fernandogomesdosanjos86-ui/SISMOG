import React, { useMemo } from 'react';
import { DollarSign, Utensils, Bus, Fuel, Award } from 'lucide-react';
import StatCard from '../../../../components/StatCard';
import type { BeneficioCalculado } from '../types';

interface BeneficiosKPIsProps {
    data: BeneficioCalculado[];
}

const BeneficiosKPIs: React.FC<BeneficiosKPIsProps> = ({ data }) => {
    const { totalBeneficios, totalAlimentacao, totalTransporte, totalCombustivel, totalIncentivo } = useMemo(() => {
        return {
            totalBeneficios: data.reduce((acc, curr) => acc + (curr.total_geral || 0), 0),
            totalAlimentacao: data.reduce((acc, curr) => acc + (curr.total_alimentacao || 0), 0),
            totalTransporte: data.reduce((acc, curr) => acc + (curr.total_transporte || 0), 0),
            totalCombustivel: data.reduce((acc, curr) => acc + (curr.total_combustivel || 0), 0),
            totalIncentivo: data.reduce((acc, curr) => acc + (curr.valor_incentivo_mensal || 0), 0),
        };
    }, [data]);

    const formatarMoeda = (valor: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard
                title="Total Geral"
                value={formatarMoeda(totalBeneficios)}
                icon={DollarSign}
                type="info"
            />
            <StatCard
                title="Alimentação"
                value={formatarMoeda(totalAlimentacao)}
                icon={Utensils}
                type="success"
            />
            <StatCard
                title="Transporte"
                value={formatarMoeda(totalTransporte)}
                icon={Bus}
                type="warning"
            />
            <StatCard
                title="Combustível"
                value={formatarMoeda(totalCombustivel)}
                icon={Fuel}
                type="danger"
            />
            <StatCard
                title="Incentivo"
                value={formatarMoeda(totalIncentivo)}
                icon={Award}
            />
        </div>
    );
};

export default BeneficiosKPIs;
