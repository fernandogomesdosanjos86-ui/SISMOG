import React from 'react';

interface CompanyBadgeProps {
    company: 'SEMOG' | 'FEMOG';
    className?: string;
}

const CompanyBadge: React.FC<CompanyBadgeProps> = ({ company, className = '' }) => {
    const styles = {
        SEMOG: 'bg-orange-100 text-orange-800 border-orange-200',
        FEMOG: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${styles[company]} ${className}`}>
            {company}
        </span>
    );
};

export default CompanyBadge;
