import { describe, expect, it } from 'vitest';
import {
  calculateEmployerContributions,
  type EmployerContributionConfig,
} from './calculate-employer-contributions';

describe('Calculate Employer Contributions (GPS)', () => {
  const defaultConfig: EmployerContributionConfig = {
    ratPercent: 2, // RAT 2% (medium risk)
    fapFactor: 1.0, // FAP neutral
    terceirosPercent: 5.8, // Sistema S standard
  };

  it('should calculate INSS patronal as 20% of gross payroll', () => {
    const totalBrutoFolha = 100000;
    const result = calculateEmployerContributions(
      totalBrutoFolha,
      defaultConfig,
    );

    expect(result.inssPatronal).toBe(20000); // 100000 * 0.20
  });

  it('should calculate RAT adjusted by FAP', () => {
    const totalBrutoFolha = 100000;
    const config: EmployerContributionConfig = {
      ratPercent: 3, // High risk
      fapFactor: 1.5,
      terceirosPercent: 5.8,
    };

    const result = calculateEmployerContributions(totalBrutoFolha, config);

    // RAT base = 100000 * 3% = 3000
    expect(result.rat).toBe(3000);
    // RAT efetivo = 100000 * (3/100) * 1.5 = 4500
    expect(result.ratEfetivo).toBe(4500);
    expect(result.fap).toBe(1.5);
  });

  it('should calculate terceiros (Sistema S) correctly', () => {
    const totalBrutoFolha = 50000;
    const result = calculateEmployerContributions(
      totalBrutoFolha,
      defaultConfig,
    );

    // Terceiros = 50000 * 5.8% = 2900
    expect(result.terceiros).toBe(2900);
  });

  it('should compute total patronal as sum of INSS + RAT efetivo + terceiros', () => {
    const totalBrutoFolha = 80000;
    const result = calculateEmployerContributions(
      totalBrutoFolha,
      defaultConfig,
    );

    const expectedTotal =
      result.inssPatronal + result.ratEfetivo + result.terceiros;
    expect(result.totalPatronal).toBe(expectedTotal);
  });

  it('should return the base de calculo', () => {
    const totalBrutoFolha = 75000;
    const result = calculateEmployerContributions(
      totalBrutoFolha,
      defaultConfig,
    );

    expect(result.baseCalculo).toBe(75000);
  });

  it('should handle FAP below 1 (favorable factor)', () => {
    const totalBrutoFolha = 100000;
    const config: EmployerContributionConfig = {
      ratPercent: 2,
      fapFactor: 0.5, // Best case scenario
      terceirosPercent: 5.8,
    };

    const result = calculateEmployerContributions(totalBrutoFolha, config);

    // RAT base = 2000, RAT efetivo = 2000 * 0.5 = 1000
    expect(result.rat).toBe(2000);
    expect(result.ratEfetivo).toBe(1000);
    expect(result.totalPatronal).toBeLessThan(
      calculateEmployerContributions(totalBrutoFolha, defaultConfig)
        .totalPatronal,
    );
  });

  it('should handle FAP at maximum (2.0)', () => {
    const totalBrutoFolha = 100000;
    const config: EmployerContributionConfig = {
      ratPercent: 3,
      fapFactor: 2.0, // Worst case
      terceirosPercent: 5.8,
    };

    const result = calculateEmployerContributions(totalBrutoFolha, config);

    // RAT efetivo = 100000 * (3/100) * 2.0 = 6000
    expect(result.ratEfetivo).toBe(6000);
  });

  it('should handle RAT 1% (low risk activity)', () => {
    const totalBrutoFolha = 100000;
    const config: EmployerContributionConfig = {
      ratPercent: 1,
      fapFactor: 1.0,
      terceirosPercent: 5.8,
    };

    const result = calculateEmployerContributions(totalBrutoFolha, config);

    expect(result.rat).toBe(1000);
    expect(result.ratEfetivo).toBe(1000);
  });

  it('should handle zero gross payroll', () => {
    const result = calculateEmployerContributions(0, defaultConfig);

    expect(result.inssPatronal).toBe(0);
    expect(result.rat).toBe(0);
    expect(result.ratEfetivo).toBe(0);
    expect(result.terceiros).toBe(0);
    expect(result.totalPatronal).toBe(0);
  });

  it('should round all values to 2 decimal places', () => {
    const totalBrutoFolha = 33333.33;
    const result = calculateEmployerContributions(
      totalBrutoFolha,
      defaultConfig,
    );

    // Verify all values are rounded to max 2 decimal places
    const decimalPlaces = (n: number) => {
      const str = n.toString();
      const dotIdx = str.indexOf('.');
      return dotIdx === -1 ? 0 : str.length - dotIdx - 1;
    };

    expect(decimalPlaces(result.inssPatronal)).toBeLessThanOrEqual(2);
    expect(decimalPlaces(result.rat)).toBeLessThanOrEqual(2);
    expect(decimalPlaces(result.ratEfetivo)).toBeLessThanOrEqual(2);
    expect(decimalPlaces(result.terceiros)).toBeLessThanOrEqual(2);
    expect(decimalPlaces(result.totalPatronal)).toBeLessThanOrEqual(2);
  });

  it('should produce a realistic total for a mid-size payroll', () => {
    // 50 employees averaging R$ 4000 = R$ 200000 payroll
    const totalBrutoFolha = 200000;
    const result = calculateEmployerContributions(
      totalBrutoFolha,
      defaultConfig,
    );

    // INSS patronal: 40000
    // RAT efetivo: 4000 (2% * 1.0)
    // Terceiros: 11600 (5.8%)
    // Total: 55600
    expect(result.totalPatronal).toBe(55600);
  });
});
