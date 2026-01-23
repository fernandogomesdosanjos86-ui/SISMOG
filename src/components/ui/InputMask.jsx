
import { forwardRef } from 'react';
import clsx from 'clsx';
import {
    normalizeCPF,
    normalizeCNPJ,
    normalizePhone,
    normalizeCep,
    normalizeCurrency
} from '../../utils/formatters';

const maskMap = {
    cpf: normalizeCPF,
    cnpj: normalizeCNPJ,
    phone: normalizePhone,
    cep: normalizeCep,
    currency: normalizeCurrency
};

// Componente Wrapper para Inputs com Máscara
const InputMask = forwardRef(({
    label,
    error,
    mask, // Nome da máscara: 'cpf', 'cnpj', 'phone', 'cep', 'currency'
    className,
    onChange, // Capturado do register do React Hook Form
    ...props
}, ref) => {

    // Intercepta o evento de mudança para aplicar a máscara
    const handleChange = (e) => {
        const originalValue = e.target.value;
        const normalizeFunc = maskMap[mask];

        // Se existe uma máscara definida, aplica
        if (mask && normalizeFunc) {
            e.target.value = normalizeFunc(originalValue);
        }

        // Chama o onChange original do React Hook Form
        if (onChange) onChange(e);
    };

    return (
        <div className="space-y-1.5 w-full">
            {label && (
                <label className="text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                onChange={handleChange}
                className={clsx(
                    "w-full px-3 py-2 rounded-lg border transition-all outline-none focus:ring-2",
                    "disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed",
                    error
                        ? "border-red-300 focus:ring-red-100 focus:border-red-500"
                        : "border-slate-300 focus:ring-blue-100 focus:border-blue-500",
                    className
                )}
                {...props}
            />
            {error && (
                <span className="text-xs text-red-600 block">
                    {error.message}
                </span>
            )}
        </div>
    );
});

InputMask.displayName = 'InputMask';
export default InputMask;
