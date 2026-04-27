// Phase 9 / Plan 09-02 — PunchRateLimitValidator spec (Wave 0 RED → GREEN).
//
// PUNCH-FRAUD-04 (D-17 / D-19 — 1 batida / 90s per employee, Redis SETNX).

import { describe, it, expect, vi } from 'vitest';
import type { Redis } from 'ioredis';

import { PunchRateLimitValidator } from './rate-limit.validator';
import type { PunchValidationContext } from './punch-validator.interface';

function makeRedisMock(setReturn: 'OK' | null, ttl = 60): Redis {
  return {
    set: vi.fn(async () => setReturn),
    ttl: vi.fn(async () => ttl),
  } as unknown as Redis;
}

function makeCtx(
  overrides: Partial<PunchValidationContext> = {},
): PunchValidationContext {
  return {
    tenantId: 'tenant-1',
    employeeId: 'emp-1',
    timestamp: new Date('2026-04-25T10:00:00Z'),
    punchConfig: { geofenceEnabled: false },
    ...overrides,
  };
}

describe('PunchRateLimitValidator (Plan 09-02)', () => {
  it('1ª batida acquires lock → ACCEPT', async () => {
    const redis = makeRedisMock('OK');
    const v = new PunchRateLimitValidator(redis);
    const result = await v.validate(makeCtx());
    expect(result.outcome).toBe('ACCEPT');
    expect(redis.set).toHaveBeenCalledWith(
      'punch:ratelimit:tenant-1:emp-1',
      '1',
      'EX',
      90,
      'NX',
    );
  });

  it('2ª batida em 89s (lock active) → REJECT RATE_LIMIT_EXCEEDED com retryAfterSec', async () => {
    const redis = makeRedisMock(null, 89);
    const v = new PunchRateLimitValidator(redis);
    const result = await v.validate(makeCtx());
    if (result.outcome !== 'REJECT') throw new Error('expected REJECT');
    expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(result.reason).toContain('89');
    expect(result.details?.retryAfterSec).toBe(89);
  });

  it('boundary: TTL=1 (último segundo) → REJECT', async () => {
    const redis = makeRedisMock(null, 1);
    const v = new PunchRateLimitValidator(redis);
    const result = await v.validate(makeCtx());
    expect(result.outcome).toBe('REJECT');
    if (result.outcome === 'REJECT') {
      expect(result.details?.retryAfterSec).toBe(1);
    }
  });

  it('3ª batida após 91s (lock expired, SETNX retorna OK) → ACCEPT', async () => {
    const redis = makeRedisMock('OK');
    const v = new PunchRateLimitValidator(redis);
    const result = await v.validate(makeCtx());
    expect(result.outcome).toBe('ACCEPT');
  });

  it('cross-tenant key isolation: same employeeId em dois tenants usa keys distintas', async () => {
    const redis = makeRedisMock('OK');
    const v = new PunchRateLimitValidator(redis);
    await v.validate(makeCtx({ tenantId: 'tenant-A', employeeId: 'emp-X' }));
    await v.validate(makeCtx({ tenantId: 'tenant-B', employeeId: 'emp-X' }));
    expect(redis.set).toHaveBeenNthCalledWith(
      1,
      'punch:ratelimit:tenant-A:emp-X',
      '1',
      'EX',
      90,
      'NX',
    );
    expect(redis.set).toHaveBeenNthCalledWith(
      2,
      'punch:ratelimit:tenant-B:emp-X',
      '1',
      'EX',
      90,
      'NX',
    );
  });
});
