import React from 'react';
import { X, Calendar as CalendarIcon, Check, CheckSquare, Square, RefreshCw } from 'lucide-react';
import type { Escala } from '../types';
import { getWeekday } from '../utils/escalaLogics';

interface EscalaCalendarModalProps {
    esc: Partial<Escala>;
    daysArray: number[];
    year: number;
    month: number;
    postoNome: string;
    toggleDay: (funcionarioId: string, dayNum: number) => void;
    handleUpdateFuncionario: (funcionarioId: string, data: Partial<Escala>) => void;
    onClose: () => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const EscalaCalendarModal: React.FC<EscalaCalendarModalProps> = ({
    esc,
    daysArray,
    year,
    month,
    postoNome,
    toggleDay,
    handleUpdateFuncionario,
    onClose
}) => {
    const activeDays = esc.dias || [];
    const is12x36 = esc.escala === '12x36';
    const funcionarioId = esc.funcionario_id!;

    // First day of month weekday offset (0 = Sunday, 1 = Monday, ...)
    const firstDayWeekday = getWeekday(year, month, 1);
    const emptySlots = Array.from({ length: firstDayWeekday }, (_, i) => i);

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthName = monthNames[month - 1] || '';

    // Quick Actions
    const handleSelectAll = () => {
        handleUpdateFuncionario(funcionarioId, { dias: [...daysArray] });
    };

    const handleClearAll = () => {
        handleUpdateFuncionario(funcionarioId, { dias: [] });
    };

    const handleApply12x36 = (startDay: 1 | 2) => {
        const newDias = daysArray.filter(d => (d % 2) === (startDay % 2));
        handleUpdateFuncionario(funcionarioId, {
            inicio_12x36: startDay,
            dias: newDias
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]">
                
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <CalendarIcon size={18} className="text-blue-300" />
                            <h3 className="font-bold text-base leading-tight">Escala do Colaborador</h3>
                        </div>
                        <p className="text-blue-100 text-sm font-semibold mt-1">
                            {esc.funcionario?.nome || 'Funcionário'}
                        </p>
                        <p className="text-blue-200 text-xs mt-0.5">
                            {postoNome} &bull; {esc.funcionario?.cargo?.cargo || 'Sem Cargo'} ({esc.escala} - {esc.turno})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                        title="Fechar"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-4 overflow-y-auto space-y-4 flex-1">
                    
                    {/* Month Title & Stats */}
                    <div className="flex items-center justify-between bg-blue-50/80 border border-blue-100 p-3 rounded-xl">
                        <div>
                            <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider">Competência</p>
                            <p className="text-base font-bold text-blue-950">{monthName} / {year}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider">Dias Trabalhados</p>
                            <p className="text-xl font-black text-blue-600">{activeDays.length} <span className="text-xs font-normal text-gray-500">/ {daysArray.length}</span></p>
                        </div>
                    </div>

                    {/* 12x36 Controls if applicable */}
                    {is12x36 && (
                        <div className="bg-amber-50/90 border border-amber-200 p-3 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                    <RefreshCw size={14} className="text-amber-600" /> Regra 12x36:
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleApply12x36(1)}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${esc.inicio_12x36 === 1
                                            ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                                            : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                                            }`}
                                    >
                                        Dia 1 (Ímpar)
                                    </button>
                                    <button
                                        onClick={() => handleApply12x36(2)}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${esc.inicio_12x36 === 2
                                            ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                                            : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                                            }`}
                                    >
                                        Dia 2 (Par)
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Selection Action Buttons */}
                    <div className="flex items-center justify-between gap-2">
                        <button
                            onClick={handleSelectAll}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                        >
                            <CheckSquare size={14} /> Marcar Todos
                        </button>
                        <button
                            onClick={handleClearAll}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                        >
                            <Square size={14} /> Limpar Todos
                        </button>
                    </div>

                    {/* Monthly Calendar Grid */}
                    <div>
                        {/* Weekday Labels Header */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-1">
                            {WEEKDAYS.map((wd, index) => (
                                <div
                                    key={wd}
                                    className={`text-[11px] font-bold py-1 uppercase ${index === 0 ? 'text-red-500' : index === 6 ? 'text-amber-600' : 'text-gray-500'}`}
                                >
                                    {wd}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {/* Empty offset slots */}
                            {emptySlots.map(slot => (
                                <div key={`empty-${slot}`} className="h-11 rounded-xl bg-gray-50/50 border border-dashed border-gray-100"></div>
                            ))}

                            {/* Day Buttons */}
                            {daysArray.map(dayNum => {
                                const isChecked = activeDays.includes(dayNum);
                                const weekdayIdx = getWeekday(year, month, dayNum);
                                const isSunday = weekdayIdx === 0;
                                const isSaturday = weekdayIdx === 6;

                                return (
                                    <button
                                        key={dayNum}
                                        type="button"
                                        onClick={() => toggleDay(funcionarioId, dayNum)}
                                        className={`h-12 rounded-xl flex flex-col items-center justify-center transition-all relative border ${isChecked
                                            ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-[1.02] ring-2 ring-blue-400'
                                            : isSunday
                                                ? 'bg-red-50/60 text-red-900 border-red-100 hover:bg-red-100'
                                                : isSaturday
                                                    ? 'bg-amber-50/60 text-amber-900 border-amber-100 hover:bg-amber-100'
                                                    : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className={`text-xs font-bold ${isChecked ? 'text-white' : ''}`}>
                                            {dayNum}
                                        </span>
                                        {isChecked && (
                                            <div className="absolute top-1 right-1 bg-white text-blue-600 rounded-full p-0.5 shadow-sm">
                                                <Check size={9} strokeWidth={3} />
                                            </div>
                                        )}
                                        <span className={`text-[9px] mt-0.5 leading-none ${isChecked ? 'text-blue-100' : 'text-gray-400'}`}>
                                            {WEEKDAYS[weekdayIdx]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-600">
                        Total selecionado: <strong>{activeDays.length} dias</strong>
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                        <Check size={16} /> Concluir
                    </button>
                </div>
            </div>
        </div>
    );
};
