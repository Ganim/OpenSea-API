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
 * `OUT_OF_GEOFENCE`; Phase 5 adds `FACE_MATCH_LOW` (D-03 / Plan 05-07);
 * fases futuras adicionam CLOCK_DRIFT, MANUAL_CORRECTION.
 */
export type PunchApprovalReasonCode = 'OUT_OF_GEOFENCE' | 'FACE_MATCH_LOW';

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
/**
 * Liveness metadata captured by the kiosk (client-side). Persisted as-is
 * for audit per D-04; NOT used to REJECT a batida in Phase 5. Phase 9
 * antifraude hardening may flip this to a gating policy once real data
 * drives the thresholds.
 */
export interface PunchLivenessMetadata {
  blinkDetected: boolean;
  trackingFrames: number;
  durationMs: number;
}

export interface PunchValidationContext {
  tenantId: string;
  employeeId: string;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  punchDevice?: { id: string; geofenceZoneId?: string | null };
  /**
   * Configuration for validator behavior. `faceMatchThreshold` feeds the
   * FaceMatchValidator (Plan 05-07 / D-03); `null` when the validator
   * should use its internal default (0.55).
   */
  punchConfig: { geofenceEnabled: boolean; faceMatchThreshold?: number };
  /**
   * 128-d face embedding extracted by the kiosk (`face-api.js` on WebGL)
   * and sent to the server for comparison against stored enrollments.
   * Absent on the JWT / PWA path (employee authenticates via token only
   * — no face challenge).
   */
  faceEmbedding?: number[] | Float32Array;
  /** Kiosk-side liveness signals. Absent on non-kiosk paths. */
  liveness?: PunchLivenessMetadata;
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
