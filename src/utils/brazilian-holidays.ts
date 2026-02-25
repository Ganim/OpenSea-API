export interface BrazilianHoliday {
  date: Date;
  name: string;
}

/**
 * Calculates Easter Sunday for a given year using the
 * Meeus/Jones/Butcher algorithm.
 */
export function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Returns all 11 Brazilian national holidays for a given year.
 * - 8 fixed holidays
 * - 3 movable holidays based on Easter (Carnaval, Sexta-feira Santa, Corpus Christi)
 */
export function getBrazilianHolidays(year: number): BrazilianHoliday[] {
  const easter = getEasterDate(year);

  return [
    { date: new Date(year, 0, 1), name: 'Confraternização Universal' },
    { date: addDays(easter, -47), name: 'Carnaval' },
    { date: addDays(easter, -2), name: 'Sexta-feira Santa' },
    { date: new Date(year, 3, 21), name: 'Tiradentes' },
    { date: new Date(year, 4, 1), name: 'Dia do Trabalho' },
    { date: addDays(easter, 60), name: 'Corpus Christi' },
    { date: new Date(year, 8, 7), name: 'Independência do Brasil' },
    { date: new Date(year, 9, 12), name: 'Nossa Senhora Aparecida' },
    { date: new Date(year, 10, 2), name: 'Finados' },
    { date: new Date(year, 10, 15), name: 'Proclamação da República' },
    { date: new Date(year, 11, 25), name: 'Natal' },
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Returns holidays that fall within a date range.
 * Supports ranges that span multiple years.
 */
export function getHolidaysInRange(
  startDate: Date,
  endDate: Date,
): BrazilianHoliday[] {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  const holidays: BrazilianHoliday[] = [];

  for (let year = startYear; year <= endYear; year++) {
    for (const holiday of getBrazilianHolidays(year)) {
      if (holiday.date >= startDate && holiday.date <= endDate) {
        holidays.push(holiday);
      }
    }
  }

  return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
}
