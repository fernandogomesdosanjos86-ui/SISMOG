interface CurriculoStatusBadgeProps {
    status: string;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    'Pendente': { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
    'Aprovado': { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
    'Reprovado': { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
    'Contratado': { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
};

const CurriculoStatusBadge: React.FC<CurriculoStatusBadgeProps> = ({ status }) => {
    const config = statusConfig[status] || statusConfig['Pendente'];

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {status}
        </span>
    );
};

export default CurriculoStatusBadge;
