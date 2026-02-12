import React from 'react';
import { type LucideIcon, BarChart2, Info, AlertTriangle, CheckCircle } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string;
    type?: 'total' | 'info' | 'warning' | 'success';
    icon?: LucideIcon;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, type = 'total', icon: Icon }) => {
    const styles = {
        total: {
            border: 'border-blue-100',
            text: 'text-blue-600',
            bg: 'bg-blue-50',
            Icon: BarChart2
        },
        info: {
            border: 'border-blue-100',
            text: 'text-blue-600',
            bg: 'bg-blue-50',
            Icon: Info
        },
        warning: {
            border: 'border-orange-100',
            text: 'text-orange-600',
            bg: 'bg-orange-50',
            Icon: AlertTriangle
        },
        success: {
            border: 'border-green-100',
            text: 'text-green-600',
            bg: 'bg-green-50',
            Icon: CheckCircle
        }
    };

    const style = styles[type];
    const DisplayIcon = Icon || style.Icon;

    return (
        <div className={`bg-white p-4 rounded-xl shadow-sm border ${style.border} flex items-center justify-between`}>
            <div>
                <p className={`text-sm ${style.text} font-medium`}>{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
            <div className={`p-3 ${style.bg} ${style.text} rounded-lg`}>
                <DisplayIcon size={24} />
            </div>
        </div>
    );
};

export default StatCard;
