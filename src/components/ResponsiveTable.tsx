import type { ReactNode } from 'react';

interface ResponsiveTableProps<T> {
    data: T[];
    columns: {
        key: keyof T | string;
        header: string;
        render?: (item: T) => ReactNode;
        className?: string;
        hideOnMobile?: boolean;
    }[];
    renderCard: (item: T) => ReactNode;
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    keyExtractor: (item: T) => string;
    getRowClassName?: (item: T) => string;
    getRowBorderColor?: (item: T) => string;
}

/**
 * Responsive Table/Card component
 * Shows table on desktop (md+) and cards on mobile
 */
function ResponsiveTable<T>({
    data,
    columns,
    renderCard,
    onRowClick,
    emptyMessage = 'Nenhum item encontrado.',
    keyExtractor,
    getRowClassName,
    getRowBorderColor,
}: ResponsiveTableProps<T>) {
    if (data.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                {emptyMessage}
            </div>
        );
    }

    return (
        <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                        <tr>
                            {columns.map((col) => (
                                <th key={String(col.key)} className={`px-6 py-3 text-left ${col.className || ''}`}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.map((item) => (
                            <tr
                                key={keyExtractor(item)}
                                onClick={() => onRowClick?.(item)}
                                className={`hover:bg-blue-50 transition relative ${onRowClick ? 'cursor-pointer' : ''} ${getRowClassName ? getRowClassName(item) : ''}`}
                            >
                                {columns.map((col, index) => (
                                    <td
                                        key={String(col.key)}
                                        className={`px-6 py-4 whitespace-nowrap ${col.className || ''} ${index === 0 && getRowBorderColor
                                                ? `border-l-4 ${getRowBorderColor(item)}`
                                                : ''
                                            }`}
                                    >
                                        {col.render ? col.render(item) : String((item as any)[col.key] ?? '-')}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {data.map((item) => (
                    <div
                        key={keyExtractor(item)}
                        onClick={() => onRowClick?.(item)}
                        className={`bg-white rounded-lg shadow p-4 ${onRowClick ? 'cursor-pointer active:bg-gray-50' : ''}`}
                    >
                        {renderCard(item)}
                    </div>
                ))}
            </div>
        </>
    );
}

export default ResponsiveTable;
