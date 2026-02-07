import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rectangular' | 'circular';
    width?: string | number;
    height?: string | number;
    lines?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rectangular',
    width,
    height,
    lines = 1
}) => {
    const baseClasses = 'animate-pulse bg-gray-200';

    const variantClasses = {
        text: 'rounded',
        rectangular: 'rounded-lg',
        circular: 'rounded-full'
    };

    const style: React.CSSProperties = {
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : '2rem')
    };

    if (lines > 1 && variant === 'text') {
        return (
            <div className={`space-y-2 ${className}`}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className={`${baseClasses} ${variantClasses[variant]}`}
                        style={{
                            ...style,
                            width: i === lines - 1 ? '75%' : '100%'
                        }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

// Table Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
    rows = 5,
    columns = 4
}) => (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex gap-4">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} variant="text" width={`${100 / columns}%`} height="0.75rem" />
                ))}
            </div>
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
            <div
                key={rowIndex}
                className="px-4 py-3 border-b border-gray-100 last:border-0"
            >
                <div className="flex gap-4 items-center">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton
                            key={colIndex}
                            variant="text"
                            width={`${100 / columns}%`}
                            height="1rem"
                        />
                    ))}
                </div>
            </div>
        ))}
    </div>
);

// Card Skeleton (Mobile)
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-gray-200">
                <div className="flex justify-between items-center mb-3">
                    <Skeleton variant="text" width="60%" height="1.25rem" />
                    <Skeleton variant="rectangular" width="4rem" height="1.5rem" />
                </div>
                <Skeleton variant="text" width="40%" height="0.875rem" className="mb-2" />
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                    <Skeleton variant="text" width="30%" height="1rem" />
                    <Skeleton variant="text" width="20%" height="0.75rem" />
                </div>
            </div>
        ))}
    </div>
);

// KPI Card Skeleton
export const KpiSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="space-y-2 flex-1">
                    <Skeleton variant="text" width="60%" height="0.875rem" />
                    <Skeleton variant="text" width="40%" height="1.75rem" />
                </div>
                <Skeleton variant="rectangular" width="3rem" height="3rem" className="ml-4" />
            </div>
        ))}
    </div>
);

export default Skeleton;
