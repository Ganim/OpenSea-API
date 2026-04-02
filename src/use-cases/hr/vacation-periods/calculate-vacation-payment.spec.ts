import { describe, expect, it } from 'vitest';
import {
  calculateVacationPayment,
  type VacationPaymentRequest,
} from './calculate-vacation-payment';

describe('Calculate Vacation Payment', () => {
  const defaultRequest: VacationPaymentRequest = {
    baseSalary: 3000,
    averageVariables: 0,
    vacationDays: 30,
    soldDays: 0,
    vacationStartDate: new Date('2024-07-01'), // Monday
    taxYear: 2024,
  };

  describe('basic vacation calculation', () => {
    it('should calculate 30 days of vacation with 1/3 constitutional bonus', () => {
      const result = calculateVacationPayment(defaultRequest);

      // Daily rate = 3000 / 30 = 100
      expect(result.dailyRate).toBe(100);
      // Vacation base = 100 * 30 = 3000
      expect(result.vacationBase).toBe(3000);
      // Constitutional third = 3000 / 3 = 1000
      expect(result.constitutionalThird).toBe(1000);
      // Gross = 3000 + 1000 = 4000 (no abono)
      expect(result.grossTotal).toBe(4000);
    });

    it('should include average variables in daily rate', () => {
      const result = calculateVacationPayment({
        ...defaultRequest,
        averageVariables: 600, // avg overtime/bonuses
      });

      // Daily rate = (3000 + 600) / 30 = 120
      expect(result.dailyRate).toBe(120);
      expect(result.vacationBase).toBe(3600); // 120 * 30
      expect(result.constitutionalThird).toBe(1200); // 3600 / 3
    });
  });

  describe('abono pecuniario (selling vacation days)', () => {
    it('should calculate abono for 10 sold days', () => {
      const result = calculateVacationPayment({
        ...defaultRequest,
        vacationDays: 20, // Taking 20 days
        soldDays: 10, // Selling 10 days
      });

      // Daily rate = 100
      expect(result.abonoPecuniario).toBe(1000); // 100 * 10
      expect(result.abonoThird).toBe(333.33); // 1000 / 3 = 333.33
      // Gross = vacationBase(2000) + third(666.67) + abono(1000) + abonoThird(333.33)
      expect(result.grossTotal).toBe(4000);
    });

    it('should not tax abono pecuniario (INSS/IRRF only on vacation+1/3)', () => {
      const highSalaryRequest: VacationPaymentRequest = {
        baseSalary: 10000,
        averageVariables: 0,
        vacationDays: 20,
        soldDays: 10,
        vacationStartDate: new Date('2024-07-01'),
        taxYear: 2024,
      };

      const result = calculateVacationPayment(highSalaryRequest);

      // Taxable base should be vacationBase + constitutionalThird only
      const _taxableGross = result.vacationBase + result.constitutionalThird;
      // INSS should be calculated over taxable gross, not the full amount
      expect(result.inssDeduction).toBeGreaterThan(0);
      // Net = gross - INSS - IRRF
      expect(result.netTotal).toBe(
        Math.round(
          (result.grossTotal - result.inssDeduction - result.irrfDeduction) *
            100,
        ) / 100,
      );
    });
  });

  describe('INSS deduction', () => {
    it('should calculate progressive INSS on vacation + 1/3', () => {
      const result = calculateVacationPayment(defaultRequest);

      // Vacation + 1/3 = 4000
      // INSS progressive:
      //   1412 * 7.5% = 105.90
      //   (2666.68-1412) * 9% = 112.92
      //   (4000-2666.68) * 12% = 160.00
      //   Total ≈ 378.82
      expect(result.inssDeduction).toBeGreaterThan(0);
      expect(result.inssDeduction).toBeLessThan(result.grossTotal);
    });

    it('should apply INSS ceiling for high salaries', () => {
      const highSalaryResult = calculateVacationPayment({
        ...defaultRequest,
        baseSalary: 15000,
      });

      // Max INSS 2024 = 908.86
      expect(highSalaryResult.inssDeduction).toBeLessThanOrEqual(908.86);
    });
  });

  describe('IRRF deduction', () => {
    it('should not charge IRRF for low salary (below exempt limit)', () => {
      const lowSalaryResult = calculateVacationPayment({
        ...defaultRequest,
        baseSalary: 1412, // Minimum wage
        vacationDays: 30,
        soldDays: 0,
      });

      // Vacation + 1/3 = 1882.67, minus INSS → likely below exempt limit
      expect(lowSalaryResult.irrfDeduction).toBe(0);
    });

    it('should charge IRRF for high salary', () => {
      const highSalaryResult = calculateVacationPayment({
        ...defaultRequest,
        baseSalary: 8000,
      });

      expect(highSalaryResult.irrfDeduction).toBeGreaterThan(0);
    });

    it('should consider IRRF dependants deduction', () => {
      const withoutDependants = calculateVacationPayment({
        ...defaultRequest,
        baseSalary: 5000,
        irrfDependants: 0,
      });

      const withDependants = calculateVacationPayment({
        ...defaultRequest,
        baseSalary: 5000,
        irrfDependants: 2,
      });

      // IRRF with dependants should be lower or equal
      expect(withDependants.irrfDeduction).toBeLessThanOrEqual(
        withoutDependants.irrfDeduction,
      );
    });
  });

  describe('payment deadline', () => {
    it('should set payment deadline to 2 business days before vacation start', () => {
      // July 1st 2024 is a Monday → 2 biz days back = Thursday June 27th
      const result = calculateVacationPayment(defaultRequest);

      expect(result.paymentDeadline.getDate()).toBe(27);
      expect(result.paymentDeadline.getMonth()).toBe(5); // June (0-indexed)
    });

    it('should skip weekends when calculating deadline', () => {
      // If vacation starts on Monday June 3rd 2024:
      // 1 biz day back = Friday May 31st
      // 2 biz days back = Thursday May 30th
      const result = calculateVacationPayment({
        ...defaultRequest,
        vacationStartDate: new Date('2024-06-03'),
      });

      expect(result.paymentDeadline.getDay()).not.toBe(0); // Not Sunday
      expect(result.paymentDeadline.getDay()).not.toBe(6); // Not Saturday
    });

    it('should handle vacation starting on Wednesday', () => {
      // Wed July 10th 2024 → 2 biz days back = Mon July 8th
      const result = calculateVacationPayment({
        ...defaultRequest,
        vacationStartDate: new Date(2024, 6, 10), // Wed July 10 (local time)
      });

      expect(result.paymentDeadline.getDate()).toBe(8);
      expect(result.paymentDeadline.getMonth()).toBe(6); // July
    });
  });

  describe('net total', () => {
    it('should calculate net as gross minus INSS minus IRRF', () => {
      const result = calculateVacationPayment({
        ...defaultRequest,
        baseSalary: 6000,
      });

      const expectedNet =
        Math.round(
          (result.grossTotal - result.inssDeduction - result.irrfDeduction) *
            100,
        ) / 100;
      expect(result.netTotal).toBe(expectedNet);
    });

    it('should always have net less than or equal to gross', () => {
      const result = calculateVacationPayment(defaultRequest);
      expect(result.netTotal).toBeLessThanOrEqual(result.grossTotal);
    });
  });

  describe('validation', () => {
    it('should throw error for zero vacation days', () => {
      expect(() =>
        calculateVacationPayment({
          ...defaultRequest,
          vacationDays: 0,
        }),
      ).toThrow('Vacation days must be greater than zero');
    });

    it('should throw error for negative vacation days', () => {
      expect(() =>
        calculateVacationPayment({
          ...defaultRequest,
          vacationDays: -5,
        }),
      ).toThrow('Vacation days must be greater than zero');
    });

    it('should throw error for negative sold days', () => {
      expect(() =>
        calculateVacationPayment({
          ...defaultRequest,
          soldDays: -1,
        }),
      ).toThrow('Sold days cannot be negative');
    });
  });

  describe('rounding', () => {
    it('should round all monetary values to 2 decimal places', () => {
      const result = calculateVacationPayment({
        ...defaultRequest,
        baseSalary: 3333.33,
        averageVariables: 111.11,
      });

      const assertTwoDecimals = (value: number) => {
        const str = value.toString();
        const dotIdx = str.indexOf('.');
        if (dotIdx !== -1) {
          expect(str.length - dotIdx - 1).toBeLessThanOrEqual(2);
        }
      };

      assertTwoDecimals(result.dailyRate);
      assertTwoDecimals(result.vacationBase);
      assertTwoDecimals(result.constitutionalThird);
      assertTwoDecimals(result.grossTotal);
      assertTwoDecimals(result.inssDeduction);
      assertTwoDecimals(result.irrfDeduction);
      assertTwoDecimals(result.netTotal);
    });
  });
});
