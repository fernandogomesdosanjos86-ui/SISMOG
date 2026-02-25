import React, { type InputHTMLAttributes } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {props.required && <span className="text-red-500">*</span>}
                </label>
                <input
                    ref={ref}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-colors ${error ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-gray-300 bg-white'
                        } ${className}`}
                    {...props}
                />
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
        );
    }
);

InputField.displayName = 'InputField';
