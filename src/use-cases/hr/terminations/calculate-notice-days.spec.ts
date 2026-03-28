import { describe, expect, it } from 'vitest';
import {
  calculateNoticeDays,
  calculateNoticeValue,
  getNoticeDaysDescription,
} from './calculate-notice-days';

describe('Calculate Notice Days (Lei 12.506/2011)', () => {
  describe('calculateNoticeDays', () => {
    it('should return 30 days for less than 1 year of service', () => {
      const hireDate = new Date('2025-01-01');
      const terminationDate = new Date('2025-06-15');

      expect(calculateNoticeDays(hireDate, terminationDate)).toBe(30);
    });

    it('should return 33 days for 1 year of service', () => {
      const hireDate = new Date('2024-01-01');
      const terminationDate = new Date('2025-01-15');

      expect(calculateNoticeDays(hireDate, terminationDate)).toBe(33);
    });

    it('should return 45 days for 5 years of service', () => {
      const hireDate = new Date('2020-01-01');
      const terminationDate = new Date('2025-03-15');

      expect(calculateNoticeDays(hireDate, terminationDate)).toBe(45);
    });

    it('should return 60 days for 10 years of service', () => {
      const hireDate = new Date('2015-01-01');
      const terminationDate = new Date('2025-03-15');

      expect(calculateNoticeDays(hireDate, terminationDate)).toBe(60);
    });

    it('should cap at 90 days for 20+ years of service', () => {
      const hireDate = new Date('2000-01-01');
      const terminationDate = new Date('2025-06-01');

      // 25 years: 30 + 3*25 = 105 → capped at 90
      expect(calculateNoticeDays(hireDate, terminationDate)).toBe(90);
    });

    it('should return exactly 90 days for exactly 20 years', () => {
      const hireDate = new Date('2005-01-01');
      const terminationDate = new Date('2025-03-15');

      // 20 years: 30 + 3*20 = 90
      expect(calculateNoticeDays(hireDate, terminationDate)).toBe(90);
    });

    it('should return 30 days for 0 complete years (hired same day)', () => {
      const hireDate = new Date('2025-03-15');
      const terminationDate = new Date('2025-03-15');

      expect(calculateNoticeDays(hireDate, terminationDate)).toBe(30);
    });

    it('should not count incomplete years (11 months)', () => {
      const hireDate = new Date('2024-05-01');
      const terminationDate = new Date('2025-03-15');

      // Less than 1 full year
      expect(calculateNoticeDays(hireDate, terminationDate)).toBe(30);
    });

    it('should throw if termination date is before hire date', () => {
      const hireDate = new Date('2025-06-01');
      const terminationDate = new Date('2025-01-01');

      expect(() => calculateNoticeDays(hireDate, terminationDate)).toThrow(
        'Termination date cannot be before hire date',
      );
    });
  });

  describe('calculateNoticeValue', () => {
    it('should calculate monetary value based on daily rate', () => {
      const baseSalary = 6000;
      const noticeDays = 45;

      // (6000/30) * 45 = 9000
      expect(calculateNoticeValue(baseSalary, noticeDays)).toBe(9000);
    });

    it('should calculate base 30 days value', () => {
      const baseSalary = 3000;
      const noticeDays = 30;

      // (3000/30) * 30 = 3000
      expect(calculateNoticeValue(baseSalary, noticeDays)).toBe(3000);
    });

    it('should handle max 90 days notice', () => {
      const baseSalary = 10000;
      const noticeDays = 90;

      // (10000/30) * 90 = 30000
      expect(calculateNoticeValue(baseSalary, noticeDays)).toBe(30000);
    });

    it('should round to 2 decimal places', () => {
      const baseSalary = 4567;
      const noticeDays = 33;

      const expectedValue = Math.round((4567 / 30) * 33 * 100) / 100;
      expect(calculateNoticeValue(baseSalary, noticeDays)).toBe(expectedValue);
    });
  });

  describe('getNoticeDaysDescription', () => {
    it('should describe base period for less than 1 year', () => {
      const hireDate = new Date('2025-01-01');
      const terminationDate = new Date('2025-06-01');

      const description = getNoticeDaysDescription(hireDate, terminationDate);

      expect(description).toContain('30 dias');
      expect(description).toContain('base');
      expect(description).toContain('menos de 1 ano');
    });

    it('should describe proportional period for multiple years', () => {
      const hireDate = new Date('2020-01-01');
      const terminationDate = new Date('2025-06-01');

      const description = getNoticeDaysDescription(hireDate, terminationDate);

      expect(description).toContain('45 dias');
      expect(description).toContain('30 base');
      expect(description).toContain('15 proporcional');
      expect(description).toContain('5 anos');
    });
  });
});
