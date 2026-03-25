import { describe, expect, it } from 'vitest';
import { BoletoBarcode } from './boleto-barcode';

describe('BoletoBarcode Value Object', () => {
  describe('factorToDate', () => {
    it('should return null when factor is 0', () => {
      const result = BoletoBarcode.factorToDate(0);
      expect(result).toBeNull();
    });

    it('should handle low factors (< 1000) with old base', () => {
      // Factor 500: Oct 7, 1997 + 500 days = Feb 19, 1999
      const result = BoletoBarcode.factorToDate(500);
      expect(result).not.toBeNull();
      const d = result!;
      expect(d.getUTCFullYear()).toBe(1999);
      expect(d.getUTCMonth()).toBe(1); // February
      expect(d.getUTCDate()).toBe(19);
    });

    it('should map factor 1000 to new-cycle base (Feb 22, 2025)', () => {
      // Factor 1000 with old base = Jul 3, 2000 (< boundary), factor >= 1000
      // => uses new base: Feb 22, 2025 + (1000-1000) = Feb 22, 2025
      const result = BoletoBarcode.factorToDate(1000);
      expect(result).not.toBeNull();
      const d = result!;
      expect(d.getUTCFullYear()).toBe(2025);
      expect(d.getUTCMonth()).toBe(1);
      expect(d.getUTCDate()).toBe(22);
    });

    it('should calculate new-cycle factor 1001 = Feb 23, 2025', () => {
      const result = BoletoBarcode.factorToDate(1001);
      expect(result).not.toBeNull();
      const d = result!;
      expect(d.getUTCFullYear()).toBe(2025);
      expect(d.getUTCMonth()).toBe(1);
      expect(d.getUTCDate()).toBe(23);
    });

    it('should calculate new-cycle factor 1100 = Jun 2, 2025', () => {
      // NEW_BASE + (1100 - 1000) days = Feb 22 + 100 days = Jun 2, 2025
      const result = BoletoBarcode.factorToDate(1100);
      expect(result).not.toBeNull();
      const d = result!;
      expect(d.getUTCFullYear()).toBe(2025);
      expect(d.getUTCMonth()).toBe(5); // June
      expect(d.getUTCDate()).toBe(2);
    });

    it('should map factor 9999 to new-cycle far-future date', () => {
      // Old base + 9999 = Feb 21, 2025 (< boundary), factor >= 1000
      // => new base: Feb 22, 2025 + (9999-1000) days = Feb 22, 2025 + 8999 days
      const result = BoletoBarcode.factorToDate(9999);
      expect(result).not.toBeNull();
      const expected = new Date(Date.UTC(2025, 1, 22) + 8999 * 86400000);
      expect(result!.getTime()).toBe(expected.getTime());
    });

    it('should use old base for factors < 1000 even though result < boundary', () => {
      // Factor 1: Oct 7, 1997 + 1 day = Oct 8, 1997
      const result = BoletoBarcode.factorToDate(1);
      expect(result).not.toBeNull();
      const d = result!;
      expect(d.getUTCFullYear()).toBe(1997);
      expect(d.getUTCMonth()).toBe(9); // October
      expect(d.getUTCDate()).toBe(8);
    });
  });

  describe('dueDate getter', () => {
    it('should return null for factor 0 via factorToDate', () => {
      expect(BoletoBarcode.factorToDate(0)).toBeNull();
    });
  });

  describe('parse', () => {
    it('should return null for invalid input', () => {
      expect(BoletoBarcode.parse('12345')).toBeNull();
      expect(BoletoBarcode.parse('')).toBeNull();
    });
  });
});
