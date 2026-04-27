import type { Redis } from 'ioredis';

import type {
  PunchValidationContext,
  PunchValidationDecision,
  PunchValidator,
} from './punch-validator.interface';

/**
 * Phase 9 / Plan 09-02 / D-17 / D-19 — Per-employee rate limit (1 batida / 90s).
 *
 * Pipeline ordering (D-20): runs AFTER `idempotencyShortCircuit` in
 * ExecutePunchUseCase — a legitimate retry with the same `requestId` returns
 * the existing TimeEntry and does NOT consume the lock window.
 *
 * Implementation: Redis SETNX (atomic ≥ Redis 2.6.12) with 90s TTL.
 *   key   = `punch:ratelimit:{tenantId}:{employeeId}`
 *   value = '1'
 *   flags = NX (only set if absent), EX 90 (TTL seconds)
 *
 * On collision, returns REJECT with code RATE_LIMIT_EXCEEDED. The use case /
 * controller surface the remaining TTL via `details.retryAfterSec` (HTTP layer
 * sets `Retry-After` header per RFC 6585 §4 D-18).
 *
 * Same window applies to all entryTypes (D-19): a CLOCK_OUT 30s after CLOCK_IN
 * is rare in legitimate flows and almost always a fraud signal or operator
 * error — funcionário simply waits 90s.
 */
const RATE_LIMIT_TTL_SEC = 90;

export class PunchRateLimitValidator implements PunchValidator {
  readonly name = 'PunchRateLimitValidator';

  constructor(private readonly redis: Redis) {}

  async validate(
    ctx: PunchValidationContext,
  ): Promise<PunchValidationDecision> {
    const key = `punch:ratelimit:${ctx.tenantId}:${ctx.employeeId}`;

    // SETNX with TTL — atomic single Redis op (race-safe across replicas).
    const result = await this.redis.set(
      key,
      '1',
      'EX',
      RATE_LIMIT_TTL_SEC,
      'NX',
    );
    if (result === 'OK') {
      return { outcome: 'ACCEPT' };
    }

    // Lock already taken — fetch remaining TTL for Retry-After hinting.
    const ttl = await this.redis.ttl(key);
    const retryAfterSec = ttl > 0 ? ttl : RATE_LIMIT_TTL_SEC;
    return {
      outcome: 'REJECT',
      code: 'RATE_LIMIT_EXCEEDED',
      reason: `Aguarde ${retryAfterSec} segundos para nova batida`,
      details: {
        retryAfterSec,
        windowSec: RATE_LIMIT_TTL_SEC,
      },
    };
  }
}
