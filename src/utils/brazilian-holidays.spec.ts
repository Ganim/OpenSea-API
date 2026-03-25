import { describe, it, expect } from 'vitest';
import {
  getEasterDate,
  getBrazilianHolidays,
  getHolidaysInRange,
  isBusinessDay,
  getNextBusinessDay,
} from './brazilian-holidays';

describe('getEasterDate', () => {
  it.each([
    [2024, new Date(2024, 2, 31)], // March 31
    [2025, new Date(2025, 3, 20)], // April 20
    [2026, new Date(2026, 3, 5)], // April 5
    [2027, new Date(2027, 2, 28)], // March 28
    [2028, new Date(2028, 3, 16)], // April 16
    [2030, new Date(2030, 3, 21)], // April 21
  ])('should calculate Easter %i correctly', (year, expected) => {
    const result = getEasterDate(year);
    expect(result.getFullYear()).toBe(expected.getFullYear());
    expect(result.getMonth()).toBe(expected.getMonth());
    expect(result.getDate()).toBe(expected.getDate());
  });
});

describe('getBrazilianHolidays', () => {
  it('should return exactly 11 holidays', () => {
    const holidays = getBrazilianHolidays(2026);
    expect(holidays).toHaveLength(11);
  });

  it('should return holidays sorted by date', () => {
    const holidays = getBrazilianHolidays(2026);
    for (let i = 1; i < holidays.length; i++) {
      expect(holidays[i].date.getTime()).toBeGreaterThanOrEqual(
        holidays[i - 1].date.getTime(),
      );
    }
  });

  it('should include all 8 fixed holidays', () => {
    const holidays = getBrazilianHolidays(2026);
    const names = holidays.map((h) => h.name);

    expect(names).toContain('Confraternização Universal');
    expect(names).toContain('Tiradentes');
    expect(names).toContain('Dia do Trabalho');
    expect(names).toContain('Independência do Brasil');
    expect(names).toContain('Nossa Senhora Aparecida');
    expect(names).toContain('Finados');
    expect(names).toContain('Proclamação da República');
    expect(names).toContain('Natal');
  });

  it('should include all 3 movable holidays', () => {
    const holidays = getBrazilianHolidays(2026);
    const names = holidays.map((h) => h.name);

    expect(names).toContain('Carnaval');
    expect(names).toContain('Sexta-feira Santa');
    expect(names).toContain('Corpus Christi');
  });

  it('should calculate correct movable holiday dates for 2026', () => {
    // Easter 2026: April 5
    const holidays = getBrazilianHolidays(2026);
    const byName = Object.fromEntries(holidays.map((h) => [h.name, h]));

    // Carnaval = Easter - 47 days = Feb 17
    expect(byName['Carnaval'].date.getMonth()).toBe(1); // February
    expect(byName['Carnaval'].date.getDate()).toBe(17);

    // Sexta-feira Santa = Easter - 2 = April 3
    expect(byName['Sexta-feira Santa'].date.getMonth()).toBe(3); // April
    expect(byName['Sexta-feira Santa'].date.getDate()).toBe(3);

    // Corpus Christi = Easter + 60 = June 4
    expect(byName['Corpus Christi'].date.getMonth()).toBe(5); // June
    expect(byName['Corpus Christi'].date.getDate()).toBe(4);
  });

  it('should calculate correct movable holiday dates for 2025', () => {
    // Easter 2025: April 20
    const holidays = getBrazilianHolidays(2025);
    const byName = Object.fromEntries(holidays.map((h) => [h.name, h]));

    // Carnaval = Easter - 47 = March 4
    expect(byName['Carnaval'].date.getMonth()).toBe(2); // March
    expect(byName['Carnaval'].date.getDate()).toBe(4);

    // Sexta-feira Santa = Easter - 2 = April 18
    expect(byName['Sexta-feira Santa'].date.getMonth()).toBe(3); // April
    expect(byName['Sexta-feira Santa'].date.getDate()).toBe(18);

    // Corpus Christi = Easter + 60 = June 19
    expect(byName['Corpus Christi'].date.getMonth()).toBe(5); // June
    expect(byName['Corpus Christi'].date.getDate()).toBe(19);
  });

  it('should have correct fixed holiday dates', () => {
    const holidays = getBrazilianHolidays(2026);
    const byName = Object.fromEntries(holidays.map((h) => [h.name, h]));

    expect(byName['Confraternização Universal'].date).toEqual(
      new Date(2026, 0, 1),
    );
    expect(byName['Tiradentes'].date).toEqual(new Date(2026, 3, 21));
    expect(byName['Dia do Trabalho'].date).toEqual(new Date(2026, 4, 1));
    expect(byName['Independência do Brasil'].date).toEqual(
      new Date(2026, 8, 7),
    );
    expect(byName['Nossa Senhora Aparecida'].date).toEqual(
      new Date(2026, 9, 12),
    );
    expect(byName['Finados'].date).toEqual(new Date(2026, 10, 2));
    expect(byName['Proclamação da República'].date).toEqual(
      new Date(2026, 10, 15),
    );
    expect(byName['Natal'].date).toEqual(new Date(2026, 11, 25));
  });
});

describe('getHolidaysInRange', () => {
  it('should return only holidays within the range', () => {
    const holidays = getHolidaysInRange(
      new Date(2026, 0, 1),
      new Date(2026, 1, 28),
    );

    const names = holidays.map((h) => h.name);
    expect(names).toContain('Confraternização Universal');
    expect(names).toContain('Carnaval');
    expect(names).not.toContain('Tiradentes');
    expect(names).not.toContain('Natal');
  });

  it('should handle ranges spanning two years', () => {
    const holidays = getHolidaysInRange(
      new Date(2025, 11, 1),
      new Date(2026, 0, 31),
    );

    const names = holidays.map((h) => h.name);
    expect(names).toContain('Natal'); // Dec 25, 2025
    expect(names).toContain('Confraternização Universal'); // Jan 1, 2026
  });

  it('should return empty for a range with no holidays', () => {
    const holidays = getHolidaysInRange(
      new Date(2026, 0, 2),
      new Date(2026, 0, 10),
    );

    expect(holidays).toHaveLength(0);
  });

  it('should return sorted results', () => {
    const holidays = getHolidaysInRange(
      new Date(2026, 0, 1),
      new Date(2026, 11, 31),
    );

    for (let i = 1; i < holidays.length; i++) {
      expect(holidays[i].date.getTime()).toBeGreaterThanOrEqual(
        holidays[i - 1].date.getTime(),
      );
    }
  });
});

describe('isBusinessDay', () => {
  it('should return true for a regular weekday', () => {
    // 2026-03-25 is a Wednesday
    expect(isBusinessDay(new Date(2026, 2, 25))).toBe(true);
  });

  it('should return false for a Saturday', () => {
    // 2026-03-28 is a Saturday
    expect(isBusinessDay(new Date(2026, 2, 28))).toBe(false);
  });

  it('should return false for a Sunday', () => {
    // 2026-03-29 is a Sunday
    expect(isBusinessDay(new Date(2026, 2, 29))).toBe(false);
  });

  it('should return false for a fixed holiday', () => {
    // 2026-01-01 Confraternização Universal (Thursday)
    expect(isBusinessDay(new Date(2026, 0, 1))).toBe(false);
  });

  it('should return false for a movable holiday (Carnaval)', () => {
    // 2026 Carnaval = Feb 17 (Tuesday)
    expect(isBusinessDay(new Date(2026, 1, 17))).toBe(false);
  });

  it('should return false for Christmas on a weekday', () => {
    // 2026-12-25 is a Friday
    expect(isBusinessDay(new Date(2026, 11, 25))).toBe(false);
  });
});

describe('getNextBusinessDay', () => {
  it('should return the same date if already a business day', () => {
    // 2026-03-25 Wednesday
    const date = new Date(2026, 2, 25);
    const result = getNextBusinessDay(date);
    expect(result.getDate()).toBe(25);
    expect(result.getMonth()).toBe(2);
  });

  it('should skip a weekend to Monday', () => {
    // 2026-03-28 Saturday -> 2026-03-30 Monday
    const result = getNextBusinessDay(new Date(2026, 2, 28));
    expect(result.getDate()).toBe(30);
    expect(result.getMonth()).toBe(2);
  });

  it('should skip a holiday to the next business day', () => {
    // 2026-01-01 Thursday (holiday) -> 2026-01-02 Friday
    const result = getNextBusinessDay(new Date(2026, 0, 1));
    expect(result.getDate()).toBe(2);
    expect(result.getMonth()).toBe(0);
  });

  it('should skip consecutive non-business days (holiday + weekend)', () => {
    // 2026-12-25 Friday (Christmas) -> 2026-12-28 Monday
    const result = getNextBusinessDay(new Date(2026, 11, 25));
    expect(result.getDate()).toBe(28);
    expect(result.getMonth()).toBe(11);
  });
});
