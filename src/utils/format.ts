/**
 * Format a number to BRL currency string (e.g. "R$ 1.234,56")
 */
export const formatCurrency = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return 'R$ 0,00';

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

/**
 * Format a number to BRL currency string with variable decimal places
 * e.g. formatCurrencyPrecise(16.6666, 4) => "R$ 16,6666"
 */
export const formatCurrencyPrecise = (value: number | undefined | null, decimals: number = 2): string => {
    if (value === undefined || value === null) return `R$ 0,${'0'.repeat(decimals)}`;

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
};

/**
 * Parse a BRL currency string back to number (e.g. "R$ 1.234,56" -> 1234.56)
 */
export const parseCurrency = (value: string): number => {
    if (!value) return 0;

    // Remove non-numeric characters except comma and minus sign
    const cleanValue = value.replace(/[^\d,-]/g, '').replace(',', '.');
    const parsed = parseFloat(cleanValue);

    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Mask a string input to BRL currency format (e.g. "123456" -> "R$ 1.234,56")
 * Useful for input onChange handlers
 */
export const maskCurrency = (value: string): string => {
    // Remove everything that is not a digit
    const onlyDigits = value.replace(/\D/g, '');

    // Convert to number (cents)
    const numberValue = parseInt(onlyDigits, 10) / 100;

    if (isNaN(numberValue)) return '';

    return formatCurrency(numberValue);
};

/**
 * Format a date string or Date object to pt-BR format (DD/MM/YYYY)
 */
export const formatDate = (dateInput?: string | Date | null): string => {
    if (!dateInput) return '-';
    try {
        if (typeof dateInput === 'string') {
            if (dateInput.length === 10) {
                return new Date(dateInput + 'T12:00:00').toLocaleDateString('pt-BR');
            }
            const parsed = new Date(dateInput);
            if (isNaN(parsed.getTime())) return '-';
            return parsed.toLocaleDateString('pt-BR');
        }
        if (dateInput instanceof Date) {
            if (isNaN(dateInput.getTime())) return '-';
            return dateInput.toLocaleDateString('pt-BR');
        }
        return '-';
    } catch {
        return '-';
    }
};

/**
 * Convert an ISO/UTC date string to local "YYYY-MM-DDTHH:mm" format for <input type="datetime-local">
 */
export const formatToDatetimeLocal = (dateString?: string | null): string => {
    if (!dateString) return '';
    const dt = new Date(dateString);
    if (isNaN(dt.getTime())) return '';
    const offset = dt.getTimezoneOffset() * 60000;
    const localISOTime = new Date(dt.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
};

