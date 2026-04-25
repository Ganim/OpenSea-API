import { describe, expect, it } from 'vitest';

import { rateLimitConfig } from './rate-limits';

/**
 * Smoke test guarding rate-limit config shape. The values are referenced by
 * route registrations (`app.register(rateLimit, rateLimitConfig.X)`); a typo
 * here would silently disable rate limiting on a route. Vitest test env
 * disables rate limit globally, so this is the only guard against config
 * regressions.
 */
describe('rateLimitConfig', () => {
  it('keeps every entry in the expected shape', () => {
    for (const [key, config] of Object.entries(rateLimitConfig)) {
      expect(config, `${key}.max should be a positive number`).toMatchObject({
        max: expect.any(Number),
        timeWindow: expect.any(String),
        message: expect.any(String),
      });
      expect(config.max, `${key}.max must be > 0`).toBeGreaterThan(0);
      expect(config.timeWindow.length).toBeGreaterThan(0);
    }
  });

  it('posPairPublic — public POS device pair: 5/min/IP', () => {
    expect(rateLimitConfig.posPairPublic).toEqual({
      max: 5,
      timeWindow: '1 minute',
      message: expect.stringMatching(/pair attempts/i),
    });
  });

  it('auth — login bruteforce protection: 10/min', () => {
    expect(rateLimitConfig.auth.max).toBe(10);
    expect(rateLimitConfig.auth.timeWindow).toBe('1 minute');
  });

  it('signatureOtp — restrictive OTP guard: 5/10min', () => {
    expect(rateLimitConfig.signatureOtp.max).toBe(5);
    expect(rateLimitConfig.signatureOtp.timeWindow).toBe('10 minutes');
  });
});
