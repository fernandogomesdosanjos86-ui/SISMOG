import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/format';

interface CurrencyInputProps {
    value: number;
    onChange: (value: number) => void;
    label?: string;
    name?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    error?: string;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({
    value,
    onChange,
    label,
    name,
    placeholder = 'R$ 0,00',
    disabled = false,
    className = '',
    error
}) => {
    // Determine initial display value
    const getDisplayValue = (val: number) => {
        if (val === undefined || val === null) return 'R$ 0,00';
        return formatCurrency(val);
    };

    const [displayValue, setDisplayValue] = useState(getDisplayValue(value));

    // Sync external value changes to display
    useEffect(() => {
        setDisplayValue(getDisplayValue(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Remove everything that is not a digit
        const onlyDigits = inputValue.replace(/\D/g, '');

        if (onlyDigits === '') {
            onChange(0);
            return;
        }

        // Convert the string of "cents" to a float number
        // e.g., "1500" -> 15.00
        const numericValue = parseInt(onlyDigits, 10) / 100;

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
                placeholder={placeholder}
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
