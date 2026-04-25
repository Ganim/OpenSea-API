// Wave 0 stub — Phase 9 / Plan 09-01. Implementation arrives in Plan 09-02. See 09-VALIDATION.md.
//
// PUNCH-FRAUD-04 — Rate limit per employee (1 batida / 90s).
// Plan 09-02 implements `PunchRateLimitValidator` with Redis SETNX:
//   key=`punch:ratelimit:{tenantId}:{employeeId}` EX 90 (D-17)
//   - SETNX returns 0 → REJECT RATE_LIMIT_EXCEEDED (com Retry-After)
//   - Idempotency check ANTES do rate-limit (D-20)

import { describe, it, expect } from 'vitest';

describe('PunchRateLimitValidator (Plan 09-02 — Wave 0 stub)', () => {
  it('placeholder — Wave 0 RED gate; replaced in Plan 09-02', () => {
    expect(() => require('./rate-limit.validator')).toThrow();
  });

  it.skip('1ª batida → ACCEPT (Redis SETNX retorna 1)', () => {});
  it.skip('2ª batida em 89s → REJECT RATE_LIMIT_EXCEEDED com Retry-After', () => {});
  it.skip('2ª batida em 91s → ACCEPT (TTL Redis expirou)', () => {});
  it.skip('Redis SETNX retorna null → REJECT RATE_LIMIT_EXCEEDED', () => {});
});
