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
