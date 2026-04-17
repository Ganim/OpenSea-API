import { describe, expect, it } from 'vitest';
import {
  fromBRTDateKey,
  getDayOfWeekInBRT,
  getHourInBRT,
  isWithinNightShiftBRT,
  toBRTDateKey,
} from './brt-timezone';

describe('BRT timezone helpers', () => {
  describe('getHourInBRT', () => {
    it('returns the BRT hour regardless of server TZ', () => {
      // 2026-04-16 23:30 BRT == 2026-04-17 02:30 UTC
      const utc = new Date(Date.UTC(2026, 3, 17, 2, 30));
      expect(getHourInBRT(utc)).toBe(23);
    });

    it('handles the day-start boundary', () => {
      // 2026-04-16 00:00 BRT == 2026-04-16 03:00 UTC
      const utc = new Date(Date.UTC(2026, 3, 16, 3, 0));
      expect(getHourInBRT(utc)).toBe(0);
    });
  });

  describe('getDayOfWeekInBRT', () => {
    it('returns the BRT day-of-week', () => {
      // 2026-04-16 is Thursday in BRT; 23:00 BRT == Fri 02:00 UTC but day-of-week
      // should still be Thursday from the worker's perspective
      const utc = new Date(Date.UTC(2026, 3, 17, 2, 0));
      expect(getDayOfWeekInBRT(utc)).toBe(4); // Thursday
    });
  });

  describe('toBRTDateKey / fromBRTDateKey round-trip', () => {
    it('groups 22:00 BRT under the same calendar day as 10:00 BRT', () => {
      const morning = new Date(Date.UTC(2026, 3, 16, 13, 0)); // 10:00 BRT
      const night = new Date(Date.UTC(2026, 3, 17, 1, 0)); // 22:00 BRT prev day
      expect(toBRTDateKey(morning)).toBe('2026-04-16');
      expect(toBRTDateKey(night)).toBe('2026-04-16');
    });

    it('fromBRTDateKey returns midnight BRT (03:00 UTC)', () => {
      const d = fromBRTDateKey('2026-04-16');
      expect(d.toISOString()).toBe('2026-04-16T03:00:00.000Z');
    });
  });

  describe('isWithinNightShiftBRT', () => {
    it('22:00 BRT is night shift', () => {
      const utc = new Date(Date.UTC(2026, 3, 17, 1, 0)); // 22:00 BRT
      expect(isWithinNightShiftBRT(utc)).toBe(true);
    });

    it('04:59 BRT is still night shift', () => {
      const utc = new Date(Date.UTC(2026, 3, 16, 7, 59)); // 04:59 BRT
      expect(isWithinNightShiftBRT(utc)).toBe(true);
    });

    it('05:00 BRT is NOT night shift', () => {
      const utc = new Date(Date.UTC(2026, 3, 16, 8, 0)); // 05:00 BRT
      expect(isWithinNightShiftBRT(utc)).toBe(false);
    });

    it('14:00 BRT is NOT night shift', () => {
      const utc = new Date(Date.UTC(2026, 3, 16, 17, 0)); // 14:00 BRT
      expect(isWithinNightShiftBRT(utc)).toBe(false);
    });
  });
});
