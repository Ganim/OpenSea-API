/**
 * Rejection codes emitted by punch validators when the batida must NOT be
 * recorded. Each code maps to a human-readable reason — the controller
 * converts the code into a 400 response carrying the localized message.
 *
 * Keep this list closed: new blocking reasons require an explicit ADR.
 * Non-blocking flags (out-of-geofence etc.) go through
 * `PunchApprovalReasonCode` instead — they preserve the punch with NSR
 * (D-12 / PUNCH-CORE-06 / Portaria 671).
 */
export type PunchRejectionCode =
  | 'EMPLOYEE_NOT_FOUND'
  | 'EMPLOYEE_INACTIVE'
  | 'ON_VACATION'
  | 'ON_SICK_LEAVE'
  | 'NO_WORK_SCHEDULE';

/**
 * Reasons that force a punch into `APPROVAL_REQUIRED` — gravada com NSR
 * imutável e aprovação PENDING em paralelo. Fase 4 entrega só
 * `OUT_OF_GEOFENCE`; fases futuras adicionam FACE_MATCH_LOW, CLOCK_DRIFT,
 * MANUAL_CORRECTION.
 */
export type PunchApprovalReasonCode = 'OUT_OF_GEOFENCE';

/**
 * Sum type returned by every validator. Pipeline orchestrates: first
 * REJECT aborts, any APPROVAL_REQUIRED accumulates without aborting.
 */
export type PunchValidationDecision =
  | { outcome: 'ACCEPT' }
  | { outcome: 'REJECT'; code: PunchRejectionCode; reason: string }
  | {
      outcome: 'APPROVAL_REQUIRED';
      approvalReason: PunchApprovalReasonCode;
      reason: string;
      details: Record<string, unknown>;
    };

/**
 * Read-only context passed to each validator. Use case assembles it
 * once; validators must not mutate it.
 *
 * Tenant scoping is enforced by `tenantId` — every repo call a validator
 * makes MUST pass it in the where clause.
 */
export interface PunchValidationContext {
  tenantId: string;
  employeeId: string;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  punchDevice?: { id: string; geofenceZoneId?: string | null };
  punchConfig: { geofenceEnabled: boolean };
}

/**
 * Each concrete validator is a stateless object with a stable name (used
 * in structured logs when debugging why a punch was rejected) and an
 * async `validate` that returns a decision.
 */
export interface PunchValidator {
  readonly name: string;
  validate(ctx: PunchValidationContext): Promise<PunchValidationDecision>;
}
