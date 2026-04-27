// Phase 9 / Plan 09-02 — FaceMatchStreakValidator spec (Wave 0 RED → GREEN).
//
// PUNCH-FRAUD-07 (D-09 / D-10 / D-12 — face match 3x consecutive failures in 60min).

import { describe, it, expect, vi } from 'vitest';
import type { Redis } from 'ioredis';
import {
  FaceMatchStreakValidator,
  FACE_MATCH_STREAK_THRESHOLD,
} from './face-match-streak.validator';
import type { PunchValidationContext } from './punch-validator.interface';

function makeRedisMock(incrReturn?: number, expireReturn?: boolean): Redis {
  return {
    incr: vi.fn(async () => incrReturn ?? 1),
    expire: vi.fn(async () => ((expireReturn ?? true) ? 1 : 0)),
    del: vi.fn(async () => 1),
  } as unknown as Redis;
}

function makeCtx(
  faceMatchOutcome: 'ok' | 'low' | 'no_embedding' | undefined,
  overrides: Partial<PunchValidationContext> = {},
): PunchValidationContext {
  return {
    tenantId: 'tenant-1',
    employeeId: 'emp-1',
    timestamp: new Date('2026-04-25T10:00:00Z'),
    faceMatchOutcome,
    punchConfig: { geofenceEnabled: false },
    ...overrides,
  };
}

describe('FaceMatchStreakValidator (Plan 09-02)', () => {
  it('no_embedding (PWA path) → ACCEPT, no Redis ops', async () => {
    const redis = makeRedisMock();
    const v = new FaceMatchStreakValidator(redis);
    const result = await v.validate(makeCtx('no_embedding'));
    expect(result.outcome).toBe('ACCEPT');
    expect(redis.incr).not.toHaveBeenCalled();
    expect(redis.del).not.toHaveBeenCalled();
  });

  it('undefined faceMatchOutcome → ACCEPT, no Redis ops', async () => {
    const redis = makeRedisMock();
    const v = new FaceMatchStreakValidator(redis);
    const result = await v.validate(makeCtx(undefined));
    expect(result.outcome).toBe('ACCEPT');
    expect(redis.incr).not.toHaveBeenCalled();
  });

  it('counter=0 + match:low → counter=1, EXPIRE called once, ACCEPT', async () => {
    const redis = makeRedisMock(1, true);
    const v = new FaceMatchStreakValidator(redis);
    const result = await v.validate(makeCtx('low'));
    expect(result.outcome).toBe('ACCEPT');
    expect(redis.incr).toHaveBeenCalledWith(
      'punch:facematch:fail:tenant-1:emp-1',
    );
    expect(redis.expire).toHaveBeenCalledWith(
      'punch:facematch:fail:tenant-1:emp-1',
      3600,
    );
  });

  it('counter=2 + match:low → counter=3, APPROVAL_REQUIRED FACE_MATCH_FAIL_3X', async () => {
    const redis = makeRedisMock(3, true);
    const v = new FaceMatchStreakValidator(redis);
    const result = await v.validate(makeCtx('low'));
    if (result.outcome !== 'APPROVAL_REQUIRED')
      throw new Error('expected APPROVAL_REQUIRED');
    expect(result.approvalReason).toBe('FACE_MATCH_FAIL_3X');
    expect(result.details?.failureCount).toBe(3);
    expect(result.details?.windowMinutes).toBe(60);
    expect(result.details?.approvalId).toBeDefined();
    expect(result.reason).toContain('3 falhas');
  });

  it('match:ok → DEL key (reset counter)', async () => {
    const redis = makeRedisMock();
    const v = new FaceMatchStreakValidator(redis);
    const result = await v.validate(makeCtx('ok'));
    expect(result.outcome).toBe('ACCEPT');
    expect(redis.del).toHaveBeenCalledWith(
      'punch:facematch:fail:tenant-1:emp-1',
    );
    expect(redis.incr).not.toHaveBeenCalled();
  });

  it('TTL EXPIRE only called on first INCR (count=1)', async () => {
    const redis = makeRedisMock(2, true);
    const v = new FaceMatchStreakValidator(redis);
    const result = await v.validate(makeCtx('low'));
    expect(result.outcome).toBe('ACCEPT');
    // count === 2, so EXPIRE should NOT be called (only called when count === 1)
    expect(redis.expire).not.toHaveBeenCalled();
  });

  it('cross-tenant key isolation', async () => {
    const redis = makeRedisMock(1, true);
    const v = new FaceMatchStreakValidator(redis);
    await v.validate(
      makeCtx('low', { tenantId: 'tenant-A', employeeId: 'emp-X' }),
    );
    await v.validate(
      makeCtx('low', { tenantId: 'tenant-B', employeeId: 'emp-X' }),
    );
    expect(redis.incr).toHaveBeenNthCalledWith(
      1,
      'punch:facematch:fail:tenant-A:emp-X',
    );
    expect(redis.incr).toHaveBeenNthCalledWith(
      2,
      'punch:facematch:fail:tenant-B:emp-X',
    );
  });

  it('FACE_MATCH_STREAK_THRESHOLD === 3 (D-09)', () => {
    expect(FACE_MATCH_STREAK_THRESHOLD).toBe(3);
  });

  it('approvalId in details is a valid UUID', async () => {
    const redis = makeRedisMock(3, true);
    const v = new FaceMatchStreakValidator(redis);
    const result = await v.validate(makeCtx('low'));
    if (result.outcome !== 'APPROVAL_REQUIRED')
      throw new Error('expected APPROVAL_REQUIRED');
    const approvalId = result.details?.approvalId as string;
    // UUID v4 regex
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidRegex.test(approvalId)).toBe(true);
  });

  it('validator signature exports correctly', async () => {
    // Sanity check: FaceMatchStreakValidator is exported and constructible
    const redis = makeRedisMock();
    const v = new FaceMatchStreakValidator(redis);
    expect(v.name).toBe('FaceMatchStreakValidator');
  });
});
