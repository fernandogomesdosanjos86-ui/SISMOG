import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const Calendar: React.FC = () => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState(today.getDate());

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const isToday = (day: number) =>
        day === today.getDate() &&
        currentMonth === today.getMonth() &&
        currentYear === today.getFullYear();

    const isSelected = (day: number) => day === selectedDate;

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(y => y - 1);
        } else {
            setCurrentMonth(m => m - 1);
        }
        setSelectedDate(1);
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(y => y + 1);
        } else {
            setCurrentMonth(m => m + 1);
        }
        setSelectedDate(1);
    };

    const prevDay = () => {
        if (selectedDate <= 1) {
            prevMonth();
            const prevDays = new Date(currentYear, currentMonth, 0).getDate();
            setSelectedDate(prevDays);
        } else {
            setSelectedDate(d => d - 1);
        }
    };

    const nextDay = () => {
        if (selectedDate >= daysInMonth) {
            nextMonth();
            setSelectedDate(1);
        } else {
            setSelectedDate(d => d + 1);
        }
    };

    const selectedWeekday = new Date(currentYear, currentMonth, selectedDate).getDay();

    // Build grid cells
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-800 text-lg">Calendário</h3>
                <div className="flex items-center gap-1">
                    {/* Desktop: month nav */}
                    <div className="hidden sm:flex items-center gap-1">
                        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-semibold text-gray-700 min-w-[160px] text-center">
                            {MONTHS[currentMonth]} {currentYear}
                        </span>
                        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    {/* Mobile: day nav */}
                    <div className="flex sm:hidden items-center gap-1">
                        <button onClick={prevDay} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-sm font-semibold text-gray-700 min-w-[180px] text-center">
                            {selectedDate} de {MONTHS[currentMonth]} {currentYear}
                        </span>
                        <button onClick={nextDay} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Desktop: Full month grid */}
            <div className="hidden sm:block p-4">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 mb-2">
                    {WEEKDAYS.map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7">
                    {cells.map((day, i) => (
                        <div key={i} className="aspect-square flex items-center justify-center">
                            {day !== null ? (
                                <button
                                    onClick={() => setSelectedDate(day)}
                                    className={`
                                        w-10 h-10 rounded-full text-sm font-medium transition-all duration-200
                                        ${isToday(day) && !isSelected(day)
                                            ? 'bg-blue-100 text-blue-700 font-bold ring-2 ring-blue-300'
                                            : isSelected(day)
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                                : 'text-gray-700 hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    {day}
                                </button>
                            ) : null}
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile: Day view */}
            <div className="sm:hidden p-5">
                <div className="text-center">
                    <div className="text-6xl font-bold text-gray-800 mb-1">{selectedDate}</div>
                    <div className="text-lg text-gray-500 font-medium">{WEEKDAYS[selectedWeekday]}</div>
                    <div className="text-sm text-gray-400 mt-1">{MONTHS[currentMonth]} {currentYear}</div>
                </div>
                <div className="mt-6 py-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-gray-400 text-sm">Nenhum evento para este dia.</p>
                </div>
            </div>

            {/* Desktop: Selected day info */}
            <div className="hidden sm:block border-t border-gray-100 px-5 py-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                        {isToday(selectedDate)
                            ? 'Hoje'
                            : `${WEEKDAYS[selectedWeekday]}, ${selectedDate} de ${MONTHS[currentMonth]}`
                        }
                    </span>
                    <span className="text-xs text-gray-400">Nenhum evento</span>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
