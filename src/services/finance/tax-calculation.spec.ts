import { describe, expect, it } from 'vitest';

import {
  calculateAllRetentions,
  calculateCOFINS,
  calculateCSLL,
  calculateINSS,
  calculateIRRF,
  calculateISS,
  calculatePIS,
} from './tax-calculation.service';

describe('Tax Calculation Service', () => {
  // ==========================================================================
  // IRRF
  // ==========================================================================

  describe('calculateIRRF', () => {
    it('should return zero for exempt amount (below R$ 2.259,20)', () => {
      const result = calculateIRRF(2000);
      expect(result.amount).toBe(0);
      expect(result.rate).toBe(0);
      expect(result.taxType).toBe('IRRF');
    });

    it('should return zero for the exact exempt limit', () => {
      const result = calculateIRRF(2259.2);
      expect(result.amount).toBe(0);
    });

    it('should calculate 7.5% bracket correctly', () => {
      const result = calculateIRRF(2500);
      // 2500 * 0.075 - 169.44 = 187.50 - 169.44 = 18.06
      expect(result.amount).toBe(18.06);
    });

    it('should calculate 15% bracket correctly', () => {
      const result = calculateIRRF(3000);
      // 3000 * 0.15 - 381.44 = 450 - 381.44 = 68.56
      expect(result.amount).toBe(68.56);
    });

    it('should calculate 22.5% bracket correctly', () => {
      const result = calculateIRRF(4000);
      // 4000 * 0.225 - 662.77 = 900 - 662.77 = 237.23
      expect(result.amount).toBe(237.23);
    });

    it('should calculate 27.5% bracket correctly', () => {
      const result = calculateIRRF(10000);
      // 10000 * 0.275 - 896.00 = 2750 - 896.00 = 1854.00
      expect(result.amount).toBe(1854.0);
    });

    it('should return zero for negative amount', () => {
      const result = calculateIRRF(-500);
      expect(result.amount).toBe(0);
    });

    it('should return zero for zero amount', () => {
      const result = calculateIRRF(0);
      expect(result.amount).toBe(0);
    });

    it('should handle boundary between 7.5% and 15% brackets', () => {
      // R$ 2.826,65 is the upper limit of 7.5% bracket
      const result75 = calculateIRRF(2826.65);
      expect(result75.amount).toBeGreaterThan(0);

      // R$ 2.826,66 enters the 15% bracket
      const result15 = calculateIRRF(2826.66);
      expect(result15.amount).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // ISS
  // ==========================================================================

  describe('calculateISS', () => {
    it('should calculate with default 5% rate', () => {
      const result = calculateISS(10000);
      expect(result.amount).toBe(500);
      expect(result.rate).toBe(0.05);
      expect(result.taxType).toBe('ISS');
    });

    it('should calculate with custom rate', () => {
      const result = calculateISS(10000, 0.02);
      expect(result.amount).toBe(200);
      expect(result.rate).toBe(0.02);
    });

    it('should return zero for zero amount', () => {
      const result = calculateISS(0);
      expect(result.amount).toBe(0);
    });

    it('should return zero for negative amount', () => {
      const result = calculateISS(-1000);
      expect(result.amount).toBe(0);
    });
  });

  // ==========================================================================
  // INSS
  // ==========================================================================

  describe('calculateINSS', () => {
    it('should calculate first bracket only (up to R$ 1.518,00)', () => {
      const result = calculateINSS(1500);
      // 1500 * 0.075 = 112.50
      expect(result.amount).toBe(112.5);
      expect(result.taxType).toBe('INSS');
    });

    it('should calculate progressively across two brackets', () => {
      const result = calculateINSS(2000);
      // Faixa 1: 1518.00 * 0.075 = 113.85
      // Faixa 2: (2000 - 1518.00) * 0.09 = 482 * 0.09 = 43.38
      // Total: 113.85 + 43.38 = 157.23
      expect(result.amount).toBe(157.23);
    });

    it('should calculate progressively across all four brackets', () => {
      const result = calculateINSS(5000);
      // Faixa 1: 1518.00 * 0.075 = 113.85
      // Faixa 2: (2793.88 - 1518.00) * 0.09 = 1275.88 * 0.09 = 114.8292
      // Faixa 3: (4190.83 - 2793.88) * 0.12 = 1396.95 * 0.12 = 167.634
      // Faixa 4: (5000 - 4190.83) * 0.14 = 809.17 * 0.14 = 113.2838
      // Total: 113.85 + 114.8292 + 167.634 + 113.2838 = 509.597 → 509.60
      expect(result.amount).toBe(509.6);
    });

    it('should respect the contribution ceiling (R$ 951,63)', () => {
      const result = calculateINSS(20000);
      expect(result.amount).toBe(951.63);
    });

    it('should return zero for zero salary', () => {
      const result = calculateINSS(0);
      expect(result.amount).toBe(0);
    });

    it('should return zero for negative salary', () => {
      const result = calculateINSS(-1000);
      expect(result.amount).toBe(0);
    });
  });

  // ==========================================================================
  // PIS
  // ==========================================================================

  describe('calculatePIS', () => {
    it('should calculate cumulativo rate (0.65%)', () => {
      const result = calculatePIS(10000, 'CUMULATIVO');
      expect(result.amount).toBe(65);
      expect(result.rate).toBe(0.0065);
      expect(result.taxType).toBe('PIS');
    });

    it('should calculate não-cumulativo rate (1.65%)', () => {
      const result = calculatePIS(10000, 'NAO_CUMULATIVO');
      expect(result.amount).toBe(165);
      expect(result.rate).toBe(0.0165);
    });

    it('should default to cumulativo when no regime specified', () => {
      const result = calculatePIS(10000);
      expect(result.amount).toBe(65);
    });

    it('should return zero for zero amount', () => {
      const result = calculatePIS(0);
      expect(result.amount).toBe(0);
    });
  });

  // ==========================================================================
  // COFINS
  // ==========================================================================

  describe('calculateCOFINS', () => {
    it('should calculate cumulativo rate (3%)', () => {
      const result = calculateCOFINS(10000, 'CUMULATIVO');
      expect(result.amount).toBe(300);
      expect(result.rate).toBe(0.03);
      expect(result.taxType).toBe('COFINS');
    });

    it('should calculate não-cumulativo rate (7.6%)', () => {
      const result = calculateCOFINS(10000, 'NAO_CUMULATIVO');
      expect(result.amount).toBe(760);
      expect(result.rate).toBe(0.076);
    });

    it('should default to cumulativo', () => {
      const result = calculateCOFINS(10000);
      expect(result.amount).toBe(300);
    });

    it('should return zero for negative amount', () => {
      const result = calculateCOFINS(-5000);
      expect(result.amount).toBe(0);
    });
  });

  // ==========================================================================
  // CSLL
  // ==========================================================================

  describe('calculateCSLL', () => {
    it('should calculate 9% rate', () => {
      const result = calculateCSLL(10000);
      expect(result.amount).toBe(900);
      expect(result.rate).toBe(0.09);
      expect(result.taxType).toBe('CSLL');
    });

    it('should return zero for zero amount', () => {
      const result = calculateCSLL(0);
      expect(result.amount).toBe(0);
    });
  });

  // ==========================================================================
  // calculateAllRetentions
  // ==========================================================================

  describe('calculateAllRetentions', () => {
    it('should calculate all retentions when all flags are true', () => {
      const result = calculateAllRetentions(10000, {
        applyIRRF: true,
        applyISS: true,
        applyINSS: true,
        applyPIS: true,
        applyCOFINS: true,
        applyCSLL: true,
      });

      expect(result.retentions).toHaveLength(6);
      expect(result.totalRetained).toBeGreaterThan(0);
      expect(result.netAmount).toBe(
        Math.round((10000 - result.totalRetained) * 100) / 100,
      );
    });

    it('should return empty retentions when no flags are set', () => {
      const result = calculateAllRetentions(10000, {});
      expect(result.retentions).toHaveLength(0);
      expect(result.totalRetained).toBe(0);
      expect(result.netAmount).toBe(10000);
    });

    it('should calculate only selected taxes', () => {
      const result = calculateAllRetentions(10000, {
        applyISS: true,
        applyPIS: true,
      });

      expect(result.retentions).toHaveLength(2);
      expect(result.retentions[0].taxType).toBe('ISS');
      expect(result.retentions[1].taxType).toBe('PIS');
    });

    it('should use custom ISS rate when provided', () => {
      const result = calculateAllRetentions(10000, {
        applyISS: true,
        issRate: 0.02,
      });

      expect(result.retentions[0].amount).toBe(200);
    });

    it('should use não-cumulativo regime for PIS/COFINS when specified', () => {
      const result = calculateAllRetentions(10000, {
        applyPIS: true,
        applyCOFINS: true,
        taxRegime: 'NAO_CUMULATIVO',
      });

      const pis = result.retentions.find((r) => r.taxType === 'PIS');
      const cofins = result.retentions.find((r) => r.taxType === 'COFINS');

      expect(pis?.rate).toBe(0.0165);
      expect(cofins?.rate).toBe(0.076);
    });

    it('should correctly compute netAmount = grossAmount - totalRetained', () => {
      const result = calculateAllRetentions(5000, {
        applyISS: true,
        applyCSLL: true,
      });

      // ISS: 5000 * 0.05 = 250
      // CSLL: 5000 * 0.09 = 450
      // Total: 700
      expect(result.totalRetained).toBe(700);
      expect(result.netAmount).toBe(4300);
    });
  });
});
