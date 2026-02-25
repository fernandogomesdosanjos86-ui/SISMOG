import React, { useState, useEffect } from 'react';

interface MaskedInputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    label: string;
    mask: string;
    error?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MaskedInputField = React.forwardRef<HTMLInputElement, MaskedInputFieldProps>(
    ({ label, mask, error, className = '', onChange, value, ...props }, ref) => {
        const [internalValue, setInternalValue] = useState(value as string || '');

        useEffect(() => {
            const valStr = value as string || '';
            setInternalValue(formatValue(valStr, mask));
        }, [value, mask]);

        const formatValue = (val: string, mask: string) => {
            if (!val) return '';
            const unmasked = val.replace(/\D/g, '');
            let formatted = '';
            let unmaskedIndex = 0;

            for (let i = 0; i < mask.length; i++) {
                if (unmaskedIndex >= unmasked.length) break;
                if (mask[i] === '9') {
                    formatted += unmasked[unmaskedIndex];
                    unmaskedIndex++;
                } else {
                    formatted += mask[i];
                }
            }
            return formatted;
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            // Only format if we are typing or deleting, but let the user delete formatting chars properly
            // To keep it simple, we just re-format the whole string 
            // In a robust implementation, cursor management is needed, but for simple masks this is fine

            // To allow easy deletion:
            const formatted = formatValue(val, mask);
            setInternalValue(formatted);

            if (onChange) {
                // Standard spread on e.target skips getters like 'name' and 'id'.
                const fakeEvent = {
                    ...e,
                    target: {
                        ...e.target,
                        name: e.target.name,
                        id: e.target.id,
                        value: formatted,
                    }
                } as React.ChangeEvent<HTMLInputElement>;
                onChange(fakeEvent);
            }
        };

        return (
            <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {props.required && <span className="text-red-500">*</span>}
                </label>
                <input
                    type="text"
                    ref={ref}
                    value={internalValue}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors ${error ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-300 bg-white'
                        } ${className}`}
                    {...props}
                />
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
        );
    }
);

MaskedInputField.displayName = 'MaskedInputField';
