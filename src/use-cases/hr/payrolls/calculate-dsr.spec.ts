import { describe, expect, it } from 'vitest';
import {
  calculateDSR,
  countBusinessDays,
  countSundaysAndHolidays,
} from './calculate-dsr';

describe('Calculate DSR (Descanso Semanal Remunerado)', () => {
  describe('calculateDSR', () => {
    it('should calculate DSR correctly with standard values', () => {
      // 26 business days, 5 Sundays+holidays, R$ 1300 overtime
      // DSR = (1300 / 26) * 5 = 250.00
      const dsrAmount = calculateDSR(1300, 26, 5);
      expect(dsrAmount).toBe(250);
    });

    it('should return 0 when business days is 0', () => {
      const dsrAmount = calculateDSR(500, 0, 4);
      expect(dsrAmount).toBe(0);
    });

    it('should return 0 when overtime value is 0', () => {
      const dsrAmount = calculateDSR(0, 26, 5);
      expect(dsrAmount).toBe(0);
    });

    it('should return 0 when overtime value is negative', () => {
      const dsrAmount = calculateDSR(-100, 26, 5);
      expect(dsrAmount).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      // DSR = (1000 / 26) * 5 = 192.307692... → 192.31
      const dsrAmount = calculateDSR(1000, 26, 5);
      expect(dsrAmount).toBe(192.31);
    });

    it('should handle months with many holidays', () => {
      // December scenario: 22 business days, 9 Sundays+holidays
      // DSR = (880 / 22) * 9 = 360.00
      const dsrAmount = calculateDSR(880, 22, 9);
      expect(dsrAmount).toBe(360);
    });

    it('should handle low overtime values', () => {
      // DSR = (50 / 25) * 4 = 8.00
      const dsrAmount = calculateDSR(50, 25, 4);
      expect(dsrAmount).toBe(8);
    });
  });

  describe('countBusinessDays', () => {
    it('should count business days in January 2024 (no holidays)', () => {
      // Jan 2024: Mon=1st, 31 days → 5 Sundays → 26 business days
      const businessDays = countBusinessDays(2024, 1);
      expect(businessDays).toBe(27); // Mon-Sat = 27 days (4 Sundays + Jan has 31 days)
    });

    it('should exclude holidays from business day count', () => {
      const holidays = [new Date(2024, 0, 1)]; // Jan 1st (holiday)
      const businessDaysWithHoliday = countBusinessDays(2024, 1, holidays);
      const businessDaysNoHoliday = countBusinessDays(2024, 1);
      // Jan 1st 2024 is a Monday, so it reduces the count by 1
      expect(businessDaysWithHoliday).toBe(businessDaysNoHoliday - 1);
    });

    it('should not double-count Sunday holidays', () => {
      // If a holiday falls on a Sunday, business days should stay the same
      // Find a Sunday in January 2024: Jan 7, 14, 21, 28
      const sundayHoliday = [new Date(2024, 0, 7)]; // Jan 7th is Sunday
      const businessDaysWithSundayHoliday = countBusinessDays(
        2024,
        1,
        sundayHoliday,
      );
      const businessDaysNoHoliday = countBusinessDays(2024, 1);
      // Sunday is already excluded from business days, so no change
      expect(businessDaysWithSundayHoliday).toBe(businessDaysNoHoliday);
    });

    it('should handle February correctly (non-leap year)', () => {
      // Feb 2023 has 28 days, Feb 1st = Wednesday
      const businessDays = countBusinessDays(2023, 2);
      expect(businessDays).toBeGreaterThan(0);
      expect(businessDays).toBeLessThanOrEqual(28);
    });

    it('should handle February correctly (leap year)', () => {
      // Feb 2024 has 29 days
      const businessDays = countBusinessDays(2024, 2);
      expect(businessDays).toBeGreaterThan(0);
      expect(businessDays).toBeLessThanOrEqual(29);
    });
  });

  describe('countSundaysAndHolidays', () => {
    it('should count Sundays in January 2024', () => {
      // Jan 2024: Sundays are 7, 14, 21, 28 = 4 Sundays
      const count = countSundaysAndHolidays(2024, 1);
      expect(count).toBe(4);
    });

    it('should count Sundays plus non-Sunday holidays', () => {
      const holidays = [new Date(2024, 0, 1)]; // Jan 1st (Monday) — holiday
      const count = countSundaysAndHolidays(2024, 1, holidays);
      // 4 Sundays + 1 non-Sunday holiday = 5
      expect(count).toBe(5);
    });

    it('should not double-count holiday on Sunday', () => {
      // Jan 7th 2024 is a Sunday
      const holidays = [new Date(2024, 0, 7)];
      const countWithHoliday = countSundaysAndHolidays(2024, 1, holidays);
      const countWithout = countSundaysAndHolidays(2024, 1);
      // Already counted as Sunday, so should be the same
      expect(countWithHoliday).toBe(countWithout);
    });

    it('should handle month with multiple holidays', () => {
      const holidays = [
        new Date(2024, 10, 2), // Nov 2nd (Saturday) - Finados
        new Date(2024, 10, 15), // Nov 15th (Friday) - Proclamação
        new Date(2024, 10, 20), // Nov 20th (Wednesday) - Consciência Negra
      ];
      const count = countSundaysAndHolidays(2024, 11, holidays);
      // Nov 2024 Sundays: 3, 10, 17, 24 = 4 Sundays
      // Non-Sunday holidays: Nov 2 (Sat), Nov 15 (Fri), Nov 20 (Wed) = 3
      expect(count).toBe(7);
    });
  });
});
