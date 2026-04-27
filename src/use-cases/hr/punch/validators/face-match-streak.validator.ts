import { randomUUID } from 'node:crypto';
import type { Redis } from 'ioredis';

import type {
  PunchValidationContext,
  PunchValidationDecision,
  PunchValidator,
} from './punch-validator.interface';

/**
 * Phase 9 / Plan 09-02 / D-09 / D-10 / D-12 — Face match streak validator.
 *
 * Tracks consecutive face match failures in a 60-minute sliding window (Redis key TTL).
 * On 3 consecutive failures, returns APPROVAL_REQUIRED with reason FACE_MATCH_FAIL_3X.
 *
 * NOTE: This validator DOES NOT publish the PUNCH_EVENTS.FACE_MATCH_FAIL_3X event.
 * Per Plan 09-02 architectural decision (key_link), the event is published by
 * ExecutePunchUseCase AFTER pipeline.run() — that scope already has the loaded
 * `employee` object so `employeeName` can be populated correctly.
 *
 * D-12: On successful face match (faceMatchOutcome === 'ok'), the counter is DEL'd
 * (reset). This enables re-triggering the 3-fail streak if the employee fails again
 * after a successful match.
 */
const FACE_MATCH_STREAK_TTL_SEC = 3600; // D-09 60min sliding window
export const FACE_MATCH_STREAK_THRESHOLD = 3; // D-09 / D-10

export class FaceMatchStreakValidator implements PunchValidator {
  readonly name = 'FaceMatchStreakValidator';

  constructor(private readonly redis: Redis) {}

  async validate(
    ctx: PunchValidationContext,
  ): Promise<PunchValidationDecision> {
    // No face match attempted (PWA path, no embedding) — skip
    if (!ctx.faceMatchOutcome || ctx.faceMatchOutcome === 'no_embedding') {
      return { outcome: 'ACCEPT' };
    }

    const key = `punch:facematch:fail:${ctx.tenantId}:${ctx.employeeId}`;

    // D-12: match:ok → DEL the counter (reset on successful subsequent match)
    if (ctx.faceMatchOutcome === 'ok') {
      await this.redis.del(key);
      return { outcome: 'ACCEPT' };
    }

    // ctx.faceMatchOutcome === 'low' — increment counter
    const count = await this.redis.incr(key);
    if (count === 1) {
      // first hit — set TTL once (don't extend on each fail — true sliding-ish window)
      await this.redis.expire(key, FACE_MATCH_STREAK_TTL_SEC);
    }

    if (count >= FACE_MATCH_STREAK_THRESHOLD) {
      // D-10: APPROVAL_REQUIRED FACE_MATCH_FAIL_3X.
      // The validator returns the decision and includes a fresh approvalId in details.
      // ExecutePunchUseCase will read this decision and publish PUNCH_EVENTS.FACE_MATCH_FAIL_3X
      // (with employeeName populated) — the validator has no repo access, so it does NOT publish.
      const approvalId = randomUUID();
      return {
        outcome: 'APPROVAL_REQUIRED',
        approvalReason: 'FACE_MATCH_FAIL_3X',
        reason: `${count} falhas consecutivas de face match em 60min — revisão obrigatória`,
        details: {
          failureCount: count,
          windowMinutes: 60,
          approvalId,
        },
      };
    }

    return { outcome: 'ACCEPT' };
  }
}
