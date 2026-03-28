import { describe, expect, it } from 'vitest';
import {
  calculateUnionContribution,
  type UnionContributionParams,
} from './calculate-union-contribution';

describe('Calculate Union Contribution (Contribuição Sindical)', () => {
  const defaultParams: UnionContributionParams = {
    baseSalary: 3000,
    employeeOptedIn: true,
    tenantEnabled: true,
    referenceMonth: 3, // March — default deduction month
  };

  describe('when deduction should apply', () => {
    it('should deduct 1 day of salary (1/30) in March', () => {
      const result = calculateUnionContribution(defaultParams);

      expect(result.shouldDeduct).toBe(true);
      expect(result.amount).toBe(100); // 3000 * (1/30) = 100
      expect(result.description).toContain('Contribuição Sindical');
    });

    it('should use custom contribution rate when provided', () => {
      const result = calculateUnionContribution({
        ...defaultParams,
        contributionRate: 0.05, // 5%
      });

      expect(result.shouldDeduct).toBe(true);
      expect(result.amount).toBe(150); // 3000 * 0.05
    });

    it('should use custom deduction month when provided', () => {
      const result = calculateUnionContribution({
        ...defaultParams,
        referenceMonth: 6,
        deductionMonth: 6, // June instead of March
      });

      expect(result.shouldDeduct).toBe(true);
      expect(result.amount).toBeGreaterThan(0);
    });

    it('should round amount to 2 decimal places', () => {
      const result = calculateUnionContribution({
        ...defaultParams,
        baseSalary: 2999.99,
      });

      // 2999.99 * (1/30) = 99.9996... → 100.00
      expect(result.amount).toBe(100);
    });
  });

  describe('when deduction should NOT apply', () => {
    it('should not deduct if employee did not opt in', () => {
      const result = calculateUnionContribution({
        ...defaultParams,
        employeeOptedIn: false,
      });

      expect(result.shouldDeduct).toBe(false);
      expect(result.amount).toBe(0);
      expect(result.description).toContain('não autorizada');
    });

    it('should not deduct if tenant disabled union contribution', () => {
      const result = calculateUnionContribution({
        ...defaultParams,
        tenantEnabled: false,
      });

      expect(result.shouldDeduct).toBe(false);
      expect(result.amount).toBe(0);
      expect(result.description).toContain('não autorizada');
    });

    it('should not deduct if both tenant and employee disabled', () => {
      const result = calculateUnionContribution({
        ...defaultParams,
        tenantEnabled: false,
        employeeOptedIn: false,
      });

      expect(result.shouldDeduct).toBe(false);
      expect(result.amount).toBe(0);
    });

    it('should not deduct outside the deduction month', () => {
      const result = calculateUnionContribution({
        ...defaultParams,
        referenceMonth: 6, // June, not March
      });

      expect(result.shouldDeduct).toBe(false);
      expect(result.amount).toBe(0);
      expect(result.description).toContain('fora do mês de desconto');
    });

    it('should not deduct in January even if opted in', () => {
      const result = calculateUnionContribution({
        ...defaultParams,
        referenceMonth: 1,
      });

      expect(result.shouldDeduct).toBe(false);
    });

    it('should not deduct in December even if opted in', () => {
      const result = calculateUnionContribution({
        ...defaultParams,
        referenceMonth: 12,
      });

      expect(result.shouldDeduct).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle minimum wage salary', () => {
      const result = calculateUnionContribution({
        ...defaultParams,
        baseSalary: 1412, // 2024 minimum wage
      });

      expect(result.shouldDeduct).toBe(true);
      expect(result.amount).toBe(47.07); // 1412 * (1/30) = 47.066... → 47.07
    });

    it('should handle high salary', () => {
      const result = calculateUnionContribution({
        ...defaultParams,
        baseSalary: 50000,
      });

      expect(result.shouldDeduct).toBe(true);
      expect(result.amount).toBe(1666.67); // 50000 / 30 = 1666.666... → 1666.67
    });

    it('should handle zero salary', () => {
      const result = calculateUnionContribution({
        ...defaultParams,
        baseSalary: 0,
      });

      expect(result.shouldDeduct).toBe(true);
      expect(result.amount).toBe(0);
    });

    it('should include rate percentage in description', () => {
      const result = calculateUnionContribution(defaultParams);

      // Default rate is 1/30 ≈ 3.33%
      expect(result.description).toContain('3.33%');
    });
  });
});
