import { createHash, randomBytes } from 'node:crypto';

import { getTypedEventBus } from '@/lib/events/typed-event-bus';
import {
  PUNCH_EVENTS,
  type PunchQrRotatedData,
} from '@/lib/events/punch-events';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface RotateQrTokenRequest {
  tenantId: string;
  employeeId: string;
  /** Subject id of the admin triggering the rotation (audit trail). */
  rotatedByUserId: string;
}

export interface RotateQrTokenResponse {
  /**
   * 64-char hex token — 32 random bytes encoded. Returned ONCE to the admin
   * so the new crachá PDF can embed it. We only persist `sha256(token)`.
   */
  token: string;
  /** ISO 8601 timestamp when the rotation landed. */
  rotatedAt: string;
}

/**
 * Synchronous single-employee QR rotation (D-14 individual path).
 *
 * Flow:
 *   1. `randomBytes(32)` → 64-hex token
 *   2. `sha256(token)` → persisted hash (overwrites any previous hash, old
 *      crachá stops resolving immediately)
 *   3. `employeesRepo.rotateQrToken` updates `qrTokenHash` + `qrTokenSetAt`
 *   4. Publishes `PUNCH_EVENTS.QR_ROTATED` for audit/observability (no
 *      notification fires — admin sees the result inline)
 *
 * The plaintext `token` is surfaced only in the response. Neither this use
 * case nor downstream code logs it or persists it anywhere.
 */
export class RotateQrTokenUseCase {
  constructor(private readonly employeesRepo: EmployeesRepository) {}

  async execute(input: RotateQrTokenRequest): Promise<RotateQrTokenResponse> {
    const token = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(token).digest('hex');

    await this.employeesRepo.rotateQrToken(
      input.employeeId,
      input.tenantId,
      hash,
    );

    const rotatedAt = new Date().toISOString();

    // Event publishing MUST NOT prevent the caller from receiving the token
    // (the hash is already persisted). Swallow downstream failures.
    try {
      const data: PunchQrRotatedData = {
        employeeId: input.employeeId,
        tenantId: input.tenantId,
        rotatedByUserId: input.rotatedByUserId,
        rotatedAt,
      };
      await getTypedEventBus().publish({
        type: PUNCH_EVENTS.QR_ROTATED,
        version: 1,
        tenantId: input.tenantId,
        source: 'hr',
        sourceEntityType: 'employee',
        sourceEntityId: input.employeeId,
        data: data as unknown as Record<string, unknown>,
        metadata: { userId: input.rotatedByUserId },
      });
    } catch {
      // Fail-open: a broken event bus does not invalidate the rotation.
    }

    return { token, rotatedAt };
  }
}
