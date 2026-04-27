import type {
  PunchValidationContext,
  PunchValidationDecision,
  PunchValidator,
} from './punch-validator.interface';

/**
 * Phase 9 / Plan 09-02 / D-05 / D-06 / D-07 / D-08 — Clock drift validator.
 *
 * Compares `body.timestamp` (clientTimestampIso) vs server `Date.now()`:
 *  - drift > 120s → REJECT CLOCK_DRIFT (D-06 / D-07): "Ajuste o relógio…"
 *  - drift in (30s, 120s] → ACCEPT, but ExecutePunchUseCase later persists
 *    `metadata.clockDriftSec` for forensic audit (D-08).
 *  - drift ≤ 30s → ACCEPT, no metadata.
 *  - missing clientTimestampIso → ACCEPT (legacy device-token path Phase 4
 *    has no body.timestamp).
 *
 * Boundary semantics: the comparison is strict `>` against the tolerance,
 * so drift = 120.0s is still ACCEPT; only > 120 rejects.
 */
export const CLOCK_DRIFT_TOLERANCE_SEC = 120; // D-06 hardcoded
export const CLOCK_DRIFT_AUDIT_THRESHOLD_SEC = 30; // D-08 audit-only

export class ClockDriftValidator implements PunchValidator {
  readonly name = 'ClockDriftValidator';

  async validate(
    ctx: PunchValidationContext,
  ): Promise<PunchValidationDecision> {
    if (!ctx.clientTimestampIso) {
      // Legacy device-token path — no body.timestamp to validate. Skip.
      return { outcome: 'ACCEPT' };
    }
    const clientMs = new Date(ctx.clientTimestampIso).getTime();
    if (Number.isNaN(clientMs)) {
      // Tolerate malformed ISO — Zod schema upstream should already 400.
      return { outcome: 'ACCEPT' };
    }
    const serverMs = Date.now();
    const driftSec = Math.abs(serverMs - clientMs) / 1000;

    if (driftSec > CLOCK_DRIFT_TOLERANCE_SEC) {
      const driftMin = Math.ceil(driftSec / 60);
      return {
        outcome: 'REJECT',
        code: 'CLOCK_DRIFT',
        reason: `Ajuste o relógio do dispositivo. Diferença atual: ${driftMin} minutos`,
        details: {
          driftSec: Number(driftSec.toFixed(1)),
          serverTimeIso: new Date(serverMs).toISOString(),
          clientTimeIso: ctx.clientTimestampIso,
          toleranceSec: CLOCK_DRIFT_TOLERANCE_SEC,
        },
      };
    }
    // Below tolerance — ACCEPT. ExecutePunchUseCase recomputes drift in
    // writeAtomically and persists `metadata.clockDriftSec` when ≥ 30s
    // (D-08 audit threshold). The validator interface is read-only so we
    // do not mutate ctx here.
    return { outcome: 'ACCEPT' };
  }
}
