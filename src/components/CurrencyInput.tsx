import React, { useState, useEffect } from 'react';
import { formatCurrency, formatCurrencyPrecise } from '../utils/format';

interface CurrencyInputProps {
    value: number;
    onChange: (value: number) => void;
    label?: string;
    name?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    error?: string;
    decimalPlaces?: number; // 2 (default) or 4
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
    value,
    onChange,
    label,
    name,
    placeholder,
    disabled = false,
    className = '',
    error,
    decimalPlaces = 2
}) => {
    const divisor = Math.pow(10, decimalPlaces); // 100 for 2 decimals, 10000 for 4
    const defaultPlaceholder = placeholder || `R$ 0,${'0'.repeat(decimalPlaces)}`;

    // Determine initial display value
    const getDisplayValue = (val: number) => {
        if (val === undefined || val === null) return defaultPlaceholder;
        return decimalPlaces === 2 ? formatCurrency(val) : formatCurrencyPrecise(val, decimalPlaces);
    };

    const [displayValue, setDisplayValue] = useState(getDisplayValue(value));

    // Sync external value changes to display
    useEffect(() => {
        setDisplayValue(getDisplayValue(value));
    }, [value, decimalPlaces]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Remove everything that is not a digit
        const onlyDigits = inputValue.replace(/\D/g, '');

        if (onlyDigits === '') {
            onChange(0);
            return;
        }

        // Convert the string of "cents" to a float number
        // e.g., for 2 decimals: "1500" -> 15.00
        // e.g., for 4 decimals: "166666" -> 16.6666
        const numericValue = parseInt(onlyDigits, 10) / divisor;

        onChange(numericValue);
    };

    return (
        <div className={className}>
            {label && (
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                </label>
            )}
            <input
                type="text"
                id={name}
                name={name}
                value={displayValue}
                onChange={handleChange}
                disabled={disabled}
                placeholder={defaultPlaceholder}
                className={`w-full rounded-md border text-right shadow-sm p-2 focus:ring-2 focus:outline-none ${error
                    ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                    } ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'}`}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default CurrencyInput;

