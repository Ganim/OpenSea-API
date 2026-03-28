import { describe, expect, it } from 'vitest';
import {
  calculateNightHours,
  calculateNightShift,
  NIGHT_HOUR_FACTOR,
  NIGHT_SHIFT_PREMIUM,
} from './calculate-night-shift';

describe('Calculate Night Shift Premium (CLT Art. 73)', () => {
  describe('calculateNightHours', () => {
    it('should return full 7 night hours for 22:00-05:00 shift', () => {
      const clockIn = new Date('2024-06-15T22:00:00');
      const clockOut = new Date('2024-06-16T05:00:00');

      const nightHours = calculateNightHours(clockIn, clockOut);
      expect(nightHours).toBe(7);
    });

    it('should return 0 for daytime shift (08:00-17:00)', () => {
      const clockIn = new Date('2024-06-15T08:00:00');
      const clockOut = new Date('2024-06-15T17:00:00');

      const nightHours = calculateNightHours(clockIn, clockOut);
      expect(nightHours).toBe(0);
    });

    it('should calculate partial night hours for shift crossing into night', () => {
      // 20:00-23:00 → 1 hour of night (22:00-23:00)
      const clockIn = new Date('2024-06-15T20:00:00');
      const clockOut = new Date('2024-06-15T23:00:00');

      const nightHours = calculateNightHours(clockIn, clockOut);
      expect(nightHours).toBe(1);
    });

    it('should calculate partial night hours for early morning shift', () => {
      // 03:00-07:00 → 2 hours of night (03:00-05:00)
      const clockIn = new Date('2024-06-16T03:00:00');
      const clockOut = new Date('2024-06-16T07:00:00');

      const nightHours = calculateNightHours(clockIn, clockOut);
      expect(nightHours).toBe(2);
    });

    it('should handle shift crossing midnight (20:00-06:00)', () => {
      // 20:00-06:00 → night hours: 22:00-05:00 = 7 hours
      const clockIn = new Date('2024-06-15T20:00:00');
      const clockOut = new Date('2024-06-16T06:00:00');

      const nightHours = calculateNightHours(clockIn, clockOut);
      expect(nightHours).toBe(7);
    });

    it('should return 0 when clockOut is before or equal to clockIn', () => {
      const clockIn = new Date('2024-06-15T22:00:00');
      const clockOut = new Date('2024-06-15T22:00:00');

      expect(calculateNightHours(clockIn, clockOut)).toBe(0);
    });

    it('should cap night hours at 7 for shifts longer than 24h', () => {
      const clockIn = new Date('2024-06-15T08:00:00');
      const clockOut = new Date('2024-06-17T10:00:00'); // > 24h

      const nightHours = calculateNightHours(clockIn, clockOut);
      expect(nightHours).toBe(7);
    });

    it('should handle partial evening shift (18:00-00:00)', () => {
      // 18:00-00:00 → 2 night hours (22:00-00:00)
      const clockIn = new Date('2024-06-15T18:00:00');
      const clockOut = new Date('2024-06-16T00:00:00');

      const nightHours = calculateNightHours(clockIn, clockOut);
      expect(nightHours).toBe(2);
    });
  });

  describe('calculateNightShift', () => {
    it('should calculate full night shift premium correctly', () => {
      // Salary R$ 3300 → hourly rate = 3300 / 220 = R$ 15.00
      const clockIn = new Date('2024-06-15T22:00:00');
      const clockOut = new Date('2024-06-16T05:00:00');
      const hourlyRate = 15;

      const result = calculateNightShift(clockIn, clockOut, hourlyRate);

      expect(result.nightHours).toBe(7);
      // Reduced hours: 7 * 1.142857 = 8.0 (approx)
      expect(result.nightHourReduced).toBeCloseTo(7 * NIGHT_HOUR_FACTOR, 2);
      // Premium: reducedHours * hourlyRate * 0.20
      expect(result.premium).toBeCloseTo(
        result.nightHourReduced * hourlyRate * NIGHT_SHIFT_PREMIUM,
        1,
      );
      // Total: reducedHours * hourlyRate * 1.20
      expect(result.totalAmount).toBeCloseTo(
        result.nightHourReduced * hourlyRate * (1 + NIGHT_SHIFT_PREMIUM),
        1,
      );
    });

    it('should return zero values for daytime shift', () => {
      const clockIn = new Date('2024-06-15T08:00:00');
      const clockOut = new Date('2024-06-15T17:00:00');
      const hourlyRate = 15;

      const result = calculateNightShift(clockIn, clockOut, hourlyRate);

      expect(result.nightHours).toBe(0);
      expect(result.nightHourReduced).toBe(0);
      expect(result.premium).toBe(0);
      expect(result.totalAmount).toBe(0);
    });

    it('should calculate premium for partial night shift', () => {
      // 20:00-23:00 → 1 night hour
      const clockIn = new Date('2024-06-15T20:00:00');
      const clockOut = new Date('2024-06-15T23:00:00');
      const hourlyRate = 20;

      const result = calculateNightShift(clockIn, clockOut, hourlyRate);

      expect(result.nightHours).toBe(1);
      expect(result.nightHourReduced).toBeCloseTo(1 * NIGHT_HOUR_FACTOR, 2);
      expect(result.premium).toBeGreaterThan(0);
      expect(result.totalAmount).toBeGreaterThan(result.premium);
    });

    it('should have totalAmount = premium + base night pay', () => {
      const clockIn = new Date('2024-06-15T22:00:00');
      const clockOut = new Date('2024-06-16T05:00:00');
      const hourlyRate = 10;

      const result = calculateNightShift(clockIn, clockOut, hourlyRate);

      // totalAmount = nightHourReduced * hourlyRate * 1.2
      // premium = nightHourReduced * hourlyRate * 0.2
      // So totalAmount should be exactly 6x the premium (1.2/0.2 = 6)
      expect(result.totalAmount).toBeCloseTo(result.premium * 6, 0);
    });
  });

  describe('constants', () => {
    it('should have correct night hour reduction factor', () => {
      // CLT: 60min / 52.5min = 1.142857...
      expect(NIGHT_HOUR_FACTOR).toBeCloseTo(60 / 52.5, 4);
    });

    it('should have correct night shift premium rate (20%)', () => {
      expect(NIGHT_SHIFT_PREMIUM).toBe(0.2);
    });
  });
});
