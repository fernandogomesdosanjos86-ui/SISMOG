import React from 'react';
import type { Escala } from '../types';
import { getWeekday } from '../utils/escalaLogics';

interface EscalaRowProps {
    esc: Partial<Escala>;
    daysArray: number[];
    year: number;
    month: number;
    toggleDay: (funcionarioId: string, dayNum: number) => void;
    handleUpdateFuncionario: (funcionarioId: string, data: Partial<Escala>) => void;
}

const getWeekDayName = (year: number, month: number, day: number) => {
    const d = getWeekday(year, month, day);
    return ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d];
};

const EscalaRow: React.FC<EscalaRowProps> = ({
    esc,
    daysArray,
    year,
    month,
    toggleDay,
    handleUpdateFuncionario
}) => {
    const activeDays = esc.dias || [];
    const is12x36 = esc.escala === '12x36';
    const isExtra = esc.tipo?.trim().toLowerCase() === 'extra';

    return (
        <tr className="border-b border-gray-200 bg-white hover:bg-blue-50/20 transition-colors group">
            <td className="p-2 border-r border-gray-200 sticky left-0 z-10 bg-white group-hover:bg-blue-50/20 transition-colors shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                <div className={`font-bold text-[11px] leading-tight ${isExtra ? 'text-red-600' : 'text-gray-800'}`}>
                    {esc.funcionario?.nome || 'Func. Sem Nome'}
                </div>
                <div className="text-gray-400 text-[10px] mt-0.5 max-w-[170px] truncate">
                    {esc.funcionario?.cargo?.cargo || 'Sem Cargo'} &ndash; {esc.escala} ({esc.turno})
                </div>
            </td>

            <td className="p-2 border-r border-gray-200 bg-gray-50/30 hidden md:table-cell">
                {is12x36 ? (
                    <select
                        value={esc.inicio_12x36 || ''}
                        onChange={(e) => handleUpdateFuncionario(esc.funcionario_id!, { inicio_12x36: Number(e.target.value) as 1 | 2 })}
                        className="w-full text-[11px] border border-gray-200 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    >
                        <option value="" disabled>Selec</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                    </select>
                ) : (
                    <div className="text-center text-gray-300 text-[11px]">-</div>
                )}
            </td>

            <td className="p-2 border-r border-gray-200 text-center font-bold text-gray-800 bg-gray-50/30 text-[11px]">
                {esc.qnt_dias}
            </td>

            {daysArray.map((dayNum) => {
                const checked = activeDays.includes(dayNum);
                const weekStr = getWeekDayName(year, month, dayNum);
                const isWeekend = weekStr === 'D' || weekStr === 'S' && getWeekday(year, month, dayNum) === 6;

                return (
                    <td key={dayNum} className={`border-r border-gray-100 p-0 hover:bg-blue-50 transition-colors hidden md:table-cell ${isWeekend ? 'bg-orange-50/20' : ''}`}>
                        <label className="w-full h-full min-h-[44px] flex items-center justify-center cursor-pointer m-0">
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleDay(esc.funcionario_id!, dayNum)}
                                className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2 bg-white cursor-pointer"
                            />
                        </label>
                    </td>
                );
            })}
        </tr>
    );
};

export default React.memo(EscalaRow, (prevProps, nextProps) => {
    // Only re-render if the 'esc' object reference changes (which it does on update)
    // or if the month changes. Functions stay ignored.
    return prevProps.esc === nextProps.esc && prevProps.month === nextProps.month;
});
