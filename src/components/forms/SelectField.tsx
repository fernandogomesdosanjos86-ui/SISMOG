import React, { type SelectHTMLAttributes } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    error?: string;
    options: { value: string | number; label: string }[];
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
    ({ label, error, options, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {props.required && <span className="text-red-500">*</span>}
                </label>
                <select
                    ref={ref}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors ${error ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-300 bg-white'
                        } ${className}`}
                    {...props}
                >
                    <option value="" disabled>Selecione uma opção</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
        );
    }
);

SelectField.displayName = 'SelectField';
