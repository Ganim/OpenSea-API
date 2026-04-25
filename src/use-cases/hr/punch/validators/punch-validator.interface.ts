/**
 * Punch validator interface contract (Phase 4 D-12; extended Phase 9).
 *
 * Phase 9 additions:
 * - PunchRejectionCode +3: GPS_ACCURACY_LOW, CLOCK_DRIFT, RATE_LIMIT_EXCEEDED (D-01/D-07/D-17)
 * - PunchApprovalReasonCode +3: EMPLOYEE_SELF_REQUEST (Phase 8 enum sync), GPS_INCONSISTENT,
 *   FACE_MATCH_FAIL_3X (Phase 9 D-02/D-10)
 * - PunchValidationContext +6 optional fields: accuracy, ipAddress, clientTimestampIso,
 *   prevTimeEntry, faceMatchOutcome, metadata
 *
 * SYNC INVARIANT (Pitfall 2 / Decisions 06-02 / 07-01): adding a new value to
 * PunchApprovalReasonCode REQUIRES synced edits in same commit:
 *   1. OpenSea-API/prisma/schema.prisma (enum PunchApprovalReason)
 *   2. OpenSea-API/src/lib/events/punch-events.ts (PunchApprovalRequestedData.reason field)
 *   3. OpenSea-API/src/use-cases/hr/punch/execute-punch.ts (cast literal)
 */

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
  | 'NO_WORK_SCHEDULE'
  // Phase 9 / Plan 09-02 — Antifraude hardening
  | 'GPS_ACCURACY_LOW' // D-01 — accuracy > 100m
  | 'CLOCK_DRIFT' // D-07 — |body.timestamp - serverNow| > 120s
  | 'RATE_LIMIT_EXCEEDED'; // D-17 — Redis SETNX 90s lock por funcionário

/**
 * Reasons that force a punch into `APPROVAL_REQUIRED` — gravada com NSR
 * imutável e aprovação PENDING em paralelo. Fase 4 entrega só
 * `OUT_OF_GEOFENCE`; Phase 5 adds `FACE_MATCH_LOW` (D-03 / Plan 05-07);
 * Phase 8 adds `EMPLOYEE_SELF_REQUEST` (Plan 08-01 / D-07);
 * Phase 9 adds `GPS_INCONSISTENT` (D-02/D-04) and `FACE_MATCH_FAIL_3X` (D-10).
 */
export type PunchApprovalReasonCode =
  | 'OUT_OF_GEOFENCE'
  | 'FACE_MATCH_LOW'
  | 'EMPLOYEE_SELF_REQUEST' // Phase 8 / Plan 08-01 — sync com enum Prisma
  | 'GPS_INCONSISTENT' // Phase 9 D-02/D-04 — velocity > 200 km/h OU suspectMock
  | 'FACE_MATCH_FAIL_3X'; // Phase 9 D-10 — 3 falhas consecutivas em 60min

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
  /**
   * Phase 9 / D-01 — GPS accuracy radius in meters reported by the client
   * geolocation API. Populated by the controller from the request body for
   * `GpsConsistencyValidator` (Plan 09-02).
   */
  accuracy?: number;
  /**
   * Phase 9 / D-03 — Caller IP address (already captured by Phase 4). Used
   * by `GpsConsistencyValidator` for MaxMind GeoLite2 cross-check
   * (audit-only, never blocks).
   */
  ipAddress?: string;
  /**
   * Phase 9 / D-05 — Original ISO timestamp string from `body.timestamp`.
   * Kept distinct from `timestamp: Date` because Date object loses
   * sub-second precision; `ClockDriftValidator` parses this for accurate
   * skew measurement.
   */
  clientTimestampIso?: string;
  /**
   * Phase 9 / D-02 — Previous TimeEntry of the same employee. Populated by
   * `ExecutePunchUseCase` BEFORE `pipeline.run()` so
   * `GpsConsistencyValidator` can compute velocity = haversine(prev, curr) /
   * elapsed. Absent on first batida of the day → validator skips velocity check.
   */
  prevTimeEntry?: {
    latitude?: number;
    longitude?: number;
    timestamp: Date;
  };
  /**
   * Phase 9 / D-12 / Pitfall 6 — Wrapper exposing `FaceMatchValidator`'s
   * outcome to the streak validator without making validators aware of
   * each other. Set by the pipeline after `FaceMatchValidator` runs;
   * `FaceMatchStreakValidator` reads it to decide INCR/DEL of the Redis
   * counter.
   */
  faceMatchOutcome?: 'ok' | 'low' | 'no_embedding';
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
  /**
   * Phase 9 / D-04 / D-13 — Client-side antifraude metadata captured by
   * the kiosk + PWA pessoal (Plan 09-03):
   *   - `suspectMock`: heurística cliente-side de mock GPS (D-04).
   *   - `fingerprintHash`: sha256 dos 5 campos de fingerprint (D-14/D-15).
   *   - `fingerprintRaw`: campos serializados para drill-down em /hr/punch/audit.
   */
  metadata?: {
    suspectMock?: boolean;
    fingerprintHash?: string;
    fingerprintRaw?: Record<string, unknown>;
  };
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
