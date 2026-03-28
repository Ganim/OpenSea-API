import { describe, expect, it } from 'vitest';
import {
  calculateVacationDays,
  getVacationDaysDescription,
} from './calculate-vacation-days';

describe('Calculate Vacation Days (CLT Art. 130)', () => {
  describe('calculateVacationDays', () => {
    it('should return 30 days for 0 absences', () => {
      expect(calculateVacationDays(0)).toBe(30);
    });

    it('should return 30 days for exactly 5 absences', () => {
      expect(calculateVacationDays(5)).toBe(30);
    });

    it('should return 24 days for 6 absences', () => {
      expect(calculateVacationDays(6)).toBe(24);
    });

    it('should return 24 days for 14 absences', () => {
      expect(calculateVacationDays(14)).toBe(24);
    });

    it('should return 18 days for 15 absences', () => {
      expect(calculateVacationDays(15)).toBe(18);
    });

    it('should return 18 days for 23 absences', () => {
      expect(calculateVacationDays(23)).toBe(18);
    });

    it('should return 12 days for 24 absences', () => {
      expect(calculateVacationDays(24)).toBe(12);
    });

    it('should return 12 days for 32 absences', () => {
      expect(calculateVacationDays(32)).toBe(12);
    });

    it('should return 0 days for 33 absences (loses vacation right)', () => {
      expect(calculateVacationDays(33)).toBe(0);
    });

    it('should return 0 days for 50 absences', () => {
      expect(calculateVacationDays(50)).toBe(0);
    });

    it('should throw error for negative absences', () => {
      expect(() => calculateVacationDays(-1)).toThrow(
        'Unjustified absences cannot be negative',
      );
    });

    it('should handle boundary values at each bracket', () => {
      // Each bracket boundary
      expect(calculateVacationDays(5)).toBe(30); // Upper bound of 0-5
      expect(calculateVacationDays(6)).toBe(24); // Lower bound of 6-14
      expect(calculateVacationDays(14)).toBe(24); // Upper bound of 6-14
      expect(calculateVacationDays(15)).toBe(18); // Lower bound of 15-23
      expect(calculateVacationDays(23)).toBe(18); // Upper bound of 15-23
      expect(calculateVacationDays(24)).toBe(12); // Lower bound of 24-32
      expect(calculateVacationDays(32)).toBe(12); // Upper bound of 24-32
      expect(calculateVacationDays(33)).toBe(0); // Beyond 32
    });
  });

  describe('getVacationDaysDescription', () => {
    it('should return description with days and absence count', () => {
      const description = getVacationDaysDescription(3);
      expect(description).toContain('30 dias de férias');
      expect(description).toContain('3 faltas injustificadas');
    });

    it('should return loss description for 33+ absences', () => {
      const description = getVacationDaysDescription(35);
      expect(description).toContain('Perdeu o direito a férias');
      expect(description).toContain('mais de 32 faltas');
    });

    it('should return correct description for each bracket', () => {
      expect(getVacationDaysDescription(0)).toContain('30 dias');
      expect(getVacationDaysDescription(10)).toContain('24 dias');
      expect(getVacationDaysDescription(20)).toContain('18 dias');
      expect(getVacationDaysDescription(30)).toContain('12 dias');
    });
  });
});
