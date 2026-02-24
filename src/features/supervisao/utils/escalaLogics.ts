/**
 * Helper Logics to calculate working days inside a specific Month Component
 * based on working shifts arrangements (5x2, 6x1, 12x36).
 */

export const getDaysInMonth = (year: number, month: number) => {
    // Note: month index starts from 1 here if we use standard dates or 0 if we use JS dates.
    // By providing 0 as day to Date(year, month, 0), we get the last day of the previous month.
    return new Date(year, month, 0).getDate();
};

export const getWeekday = (year: number, month: number, day: number) => {
    // JS Date month is 0-indexed: 0 = Jan, 11 = Dec
    // Returns 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return new Date(year, month - 1, day).getDay();
};

export const generateDaysForEscala = (
    escala: '12x36' | '5x2' | '6x1' | 'Outro',
    inicio_12x36: 1 | 2 | undefined,
    month: number,
    year: number
): number[] => {
    const totalDays = getDaysInMonth(year, month);
    const selectedDays: number[] = [];

    for (let currentDay = 1; currentDay <= totalDays; currentDay++) {
        const weekday = getWeekday(year, month, currentDay); // 0 (Sun) to 6 (Sat)

        switch (escala) {
            case '5x2':
                // Monday (1) to Friday (5)
                if (weekday >= 1 && weekday <= 5) {
                    selectedDays.push(currentDay);
                }
                break;
            case '6x1':
                // Monday (1) to Saturday (6)
                if (weekday >= 1 && weekday <= 6) {
                    selectedDays.push(currentDay);
                }
                break;
            case '12x36':
                if (inicio_12x36 === 1) {
                    // Ímpar (Odd)
                    if (currentDay % 2 !== 0) {
                        selectedDays.push(currentDay);
                    }
                } else if (inicio_12x36 === 2) {
                    // Par (Even)
                    if (currentDay % 2 === 0) {
                        selectedDays.push(currentDay);
                    }
                }
                break;
            case 'Outro':
            default:
                // No pre-selected days
                break;
        }
    }

    return selectedDays;
};
