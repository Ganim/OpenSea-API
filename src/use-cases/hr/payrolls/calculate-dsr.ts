/**
 * DSR sobre Horas Extras (Descanso Semanal Remunerado)
 *
 * Formula: DSR = (Total HE no mês / dias úteis no mês) × domingos e feriados no mês
 *
 * O reflexo de DSR sobre horas extras garante que o empregado receba
 * proporcionalmente pelo descanso semanal baseado nas horas extras trabalhadas.
 */

/**
 * Calculate DSR (Descanso Semanal Remunerado) over overtime.
 *
 * @param totalOvertimeValue - Total overtime value in the month (all HE types combined)
 * @param businessDaysInMonth - Number of business days (Mon-Sat, excluding holidays)
 * @param sundaysAndHolidaysInMonth - Number of Sundays + holidays in the month
 * @returns DSR amount
 */
export function calculateDSR(
  totalOvertimeValue: number,
  businessDaysInMonth: number,
  sundaysAndHolidaysInMonth: number,
): number {
  if (businessDaysInMonth === 0) return 0;
  if (totalOvertimeValue <= 0) return 0;

  const dsr =
    (totalOvertimeValue / businessDaysInMonth) * sundaysAndHolidaysInMonth;

  return Math.round(dsr * 100) / 100;
}

/**
 * Count business days in a given month (Mon-Sat, excluding specified holidays).
 *
 * @param year - Year
 * @param month - Month (1-12)
 * @param holidays - Array of holiday dates in the month
 * @returns Number of business days
 */
export function countBusinessDays(
  year: number,
  month: number,
  holidays: Date[] = [],
): number {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const holidaySet = new Set(
    holidays.map((d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`),
  );

  let count = 0;

  for (let day = new Date(firstDay); day <= lastDay; day.setDate(day.getDate() + 1)) {
    const dayOfWeek = day.getDay();
    const dateKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;

    // Business days: Mon(1) through Sat(6), excluding holidays
    if (dayOfWeek !== 0 && !holidaySet.has(dateKey)) {
      count++;
    }
  }

  return count;
}

/**
 * Count Sundays and holidays in a given month.
 *
 * @param year - Year
 * @param month - Month (1-12)
 * @param holidays - Array of holiday dates (holidays that fall on Sunday are counted only once)
 * @returns Number of Sundays + holidays (non-Sunday holidays)
 */
export function countSundaysAndHolidays(
  year: number,
  month: number,
  holidays: Date[] = [],
): number {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const holidaySet = new Set(
    holidays.map((d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`),
  );

  let sundays = 0;
  let nonSundayHolidays = 0;

  for (let day = new Date(firstDay); day <= lastDay; day.setDate(day.getDate() + 1)) {
    const dayOfWeek = day.getDay();
    const dateKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;

    if (dayOfWeek === 0) {
      sundays++;
    } else if (holidaySet.has(dateKey)) {
      nonSundayHolidays++;
    }
  }

  return sundays + nonSundayHolidays;
}
