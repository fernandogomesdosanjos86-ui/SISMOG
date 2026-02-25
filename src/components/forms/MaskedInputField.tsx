import React from 'react';
import InputMask, { type Props as InputMaskProps } from 'react-input-mask';

interface MaskedInputFieldProps extends Omit<InputMaskProps, 'mask'> {
    label: string;
    mask: string;
    error?: string;
}

export const MaskedInputField = React.forwardRef<HTMLInputElement, MaskedInputFieldProps>(
    ({ label, mask, error, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {props.required && <span className="text-red-500">*</span>}
                </label>
                <InputMask
                    mask={mask}
                    // @ts-ignore
                    inputRef={ref}
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
