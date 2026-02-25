import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TableSkeleton, CardSkeleton } from './SkeletonLoader';

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
    loading?: boolean;
    skeletonRows?: number;
    // Pagination props
    page?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
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
    loading = false,
    skeletonRows = 5,
    page,
    totalPages,
    onPageChange,
}: ResponsiveTableProps<T>) {
    if (loading) {
        return (
            <>
                <div className="hidden md:block"><TableSkeleton rows={skeletonRows} columns={columns.length} /></div>
                <div className="md:hidden"><CardSkeleton count={skeletonRows} /></div>
            </>
        );
    }

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

            {/* Pagination Controls */}
            {page !== undefined && totalPages !== undefined && onPageChange && totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 rounded-b-lg shadow">
                    <div className="flex justify-between flex-1 sm:hidden">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${page === 1 ? 'text-gray-400 bg-gray-50' : 'text-gray-700 bg-white hover:bg-gray-50'} border border-gray-300`}
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page === totalPages}
                            className={`relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium rounded-md ${page === totalPages ? 'text-gray-400 bg-gray-50' : 'text-gray-700 bg-white hover:bg-gray-50'} border border-gray-300`}
                        >
                            Próxima
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span>
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => onPageChange(page - 1)}
                                    disabled={page === 1}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${page === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <span className="sr-only">Anterior</span>
                                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                </button>

                                {/* Current Page Indicator */}
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-blue-50 text-sm font-medium text-blue-600">
                                    {page}
                                </span>

                                <button
                                    onClick={() => onPageChange(page + 1)}
                                    disabled={page === totalPages}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${page === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    <span className="sr-only">Próxima</span>
                                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ResponsiveTable;
