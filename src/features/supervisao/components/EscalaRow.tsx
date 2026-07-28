import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { Escala } from '../types';
import { getWeekday } from '../utils/escalaLogics';
import { EscalaCalendarModal } from './EscalaCalendarModal';

interface EscalaRowProps {
    esc: Partial<Escala>;
    daysArray: number[];
    year: number;
    month: number;
    postoNome?: string;
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
    postoNome = '',
    toggleDay,
    handleUpdateFuncionario
}) => {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const activeDays = esc.dias || [];
    const is12x36 = esc.escala === '12x36';
    const isExtra = esc.tipo?.trim().toLowerCase() === 'extra';

    return (
        <>
            <tr className="border-b border-gray-200 bg-white hover:bg-blue-50/20 transition-colors group">
                {/* Employee Name (Sticky Left Column - Opaque Solid Background) */}
                <td className="p-2 border-r border-gray-300 sticky left-0 z-10 bg-white group-hover:bg-[#f0f6ff] transition-colors shadow-[4px_0_8px_-2px_rgba(0,0,0,0.12)] min-w-[240px] sm:min-w-[260px] md:min-w-[280px]">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0 pr-1">
                            <div className={`font-bold text-[11px] leading-snug whitespace-normal break-words ${isExtra ? 'text-red-600' : 'text-gray-900'}`}>
                                {esc.funcionario?.nome || 'Func. Sem Nome'}
                            </div>
                            <div className="text-gray-500 text-[10px] mt-0.5 whitespace-normal break-words">
                                {esc.funcionario?.cargo?.cargo || 'Sem Cargo'} &ndash; {esc.escala} ({esc.turno})
                            </div>
                        </div>

                        {/* Edit Days Button (Prominent on Mobile & Desktop) */}
                        <button
                            type="button"
                            onClick={() => setIsCalendarOpen(true)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors shrink-0 flex items-center gap-1 border border-blue-200 shadow-xs"
                            title="Editar dias no calendário mensal"
                        >
                            <CalendarIcon size={14} />
                            <span className="text-[10px] font-bold hidden sm:inline">Calendário</span>
                        </button>
                    </div>
                </td>

                {/* 12x36 Start Day Selection */}
                <td className="p-2 border-r border-gray-200 bg-gray-50/30 text-center min-w-[65px]">
                    {is12x36 ? (
                        <select
                            value={esc.inicio_12x36 || ''}
                            onChange={(e) => handleUpdateFuncionario(esc.funcionario_id!, { inicio_12x36: Number(e.target.value) as 1 | 2 })}
                            className="w-full text-[11px] border border-gray-200 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-center"
                        >
                            <option value="" disabled>Selec</option>
                            <option value="1">1 (Ímpar)</option>
                            <option value="2">2 (Par)</option>
                        </select>
                    ) : (
                        <div className="text-center text-gray-300 text-[11px]">-</div>
                    )}
                </td>

                {/* Quantity Badge (Clickable to open Calendar on Mobile) */}
                <td
                    onClick={() => setIsCalendarOpen(true)}
                    className="p-2 border-r border-gray-200 text-center font-bold text-gray-800 bg-gray-50/30 text-[11px] min-w-[45px] cursor-pointer hover:bg-blue-100 transition-colors"
                    title="Clique para editar dias"
                >
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-black border border-blue-200">
                        {esc.qnt_dias}
                    </span>
                </td>

                {/* 31 Days Checkboxes (Scrollable on Mobile & Desktop) */}
                {daysArray.map((dayNum) => {
                    const checked = activeDays.includes(dayNum);
                    const weekStr = getWeekDayName(year, month, dayNum);
                    const isWeekend = weekStr === 'D' || (weekStr === 'S' && getWeekday(year, month, dayNum) === 6);

                    return (
                        <td key={dayNum} className={`border-r border-gray-100 p-0 hover:bg-blue-50 transition-colors min-w-[34px] ${isWeekend ? 'bg-orange-50/20' : ''}`}>
                            <label className="w-full h-full min-h-[44px] flex items-center justify-center cursor-pointer m-0">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleDay(esc.funcionario_id!, dayNum)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2 bg-white cursor-pointer"
                                />
                            </label>
                        </td>
                    );
                })}
            </tr>

            {/* Mobile / Responsive Day Selector Modal */}
            {isCalendarOpen && (
                <EscalaCalendarModal
                    esc={esc}
                    daysArray={daysArray}
                    year={year}
                    month={month}
                    postoNome={postoNome}
                    toggleDay={toggleDay}
                    handleUpdateFuncionario={handleUpdateFuncionario}
                    onClose={() => setIsCalendarOpen(false)}
                />
            )}
        </>
    );
};

export default React.memo(EscalaRow, (prevProps, nextProps) => {
    return prevProps.esc === nextProps.esc && prevProps.month === nextProps.month && prevProps.postoNome === nextProps.postoNome;
});
