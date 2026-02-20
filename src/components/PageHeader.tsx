import type { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    subtitle: string;
    action?: ReactNode;
}

/**
 * Global Page Header component with title, subtitle and optional action button
 * Usage: <PageHeader title="Usuários" subtitle="Gestão de Usuários e Permissões" action={<PrimaryButton>Novo</PrimaryButton>} />
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{title}</h1>
                <p className="text-gray-500 mt-1">{subtitle}</p>
            </div>
            {action && <div className="w-full sm:w-auto sm:flex-shrink-0">{action}</div>}
        </div>
    );
};

export default PageHeader;
