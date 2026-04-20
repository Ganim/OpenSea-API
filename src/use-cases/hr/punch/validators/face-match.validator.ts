import { FaceEnrollmentRequiredError } from '@/@errors/use-cases/face-enrollment-required-error';
import * as faceEncryption from '@/lib/face-encryption';
import type { FaceEnrollmentsRepository } from '@/repositories/hr/face-enrollments-repository';
import type { PunchConfigRepository } from '@/repositories/hr/punch-config-repository';

import type {
  PunchValidationContext,
  PunchValidationDecision,
  PunchValidator,
} from './punch-validator.interface';

/**
 * Default Euclidean-distance threshold for face match decisions (D-03 / Plan
 * 05-01). Stricter than the face-api.js default (0.6) to bias toward
 * false-negatives (→ APPROVAL_REQUIRED, which gestor can still triage)
 * rather than false-positives (→ silent ACCEPT of a wrong identity, which
 * would be a kiosk-level security failure).
 *
 * Tenants can override via PunchConfiguration.faceMatchThreshold — the
 * repository value wins whenever it is present.
 */
const DEFAULT_FACE_MATCH_THRESHOLD = 0.55;

/**
 * FaceMatchValidator — pipeline step appended AFTER Geofence (Plan 05-07 /
 * Phase 5 / D-03 / D-10).
 *
 * Contract (plan `must_haves.truths` 4-8, D-03):
 *   1. `ctx.faceEmbedding` absent → ACCEPT (short-circuit; JWT / PWA paths
 *      do not carry a face challenge).
 *   2. `ctx.faceEmbedding` present AND zero active enrollments → throw
 *      FaceEnrollmentRequiredError. Controller maps to HTTP 412.
 *   3. Otherwise: min(Euclidean distance across enrollments) < threshold
 *      → ACCEPT. This is D-03's "min distance" policy (any enrollment
 *      match is enough — 3-5 angles cover normal variation).
 *   4. Otherwise: APPROVAL_REQUIRED with reason FACE_MATCH_LOW and details
 *      `{ distance, threshold, enrollmentCount }` for gestor triage.
 *
 * Never returns REJECT — D-12 / Portaria 671 requires that every batida
 * reach the database with a sequential NSR even when the face match is
 * weak. Rejection would lose audit evidence and violate "imediata e
 * imutável".
 */
export class FaceMatchValidator implements PunchValidator {
  readonly name = 'FaceMatchValidator';

  constructor(
    private readonly faceEnrollmentsRepo: FaceEnrollmentsRepository,
    private readonly punchConfigRepo: PunchConfigRepository,
  ) {}

  async validate(
    ctx: PunchValidationContext,
  ): Promise<PunchValidationDecision> {
    // (1) Short-circuit: no embedding → JWT/PWA path, nothing to match.
    if (!ctx.faceEmbedding) {
      return { outcome: 'ACCEPT' };
    }

    // (2) Enrollment gate — every kiosk path (QR, PIN) still requires
    // the employee to have a face enrollment. D-10 forbids single-factor
    // entry; "PIN sozinho" or "QR sozinho" cannot bypass the face step.
    const enrollments = await this.faceEnrollmentsRepo.findByEmployeeId(
      ctx.employeeId,
      ctx.tenantId,
    );
    if (enrollments.length === 0) {
      throw new FaceEnrollmentRequiredError();
    }

    // Threshold priority: context override (if the caller pre-resolved it)
    // > tenant config row > global default. We read the row lazily to
    // avoid a DB roundtrip when the caller already knows the value
    // (future optimization; the use case currently does NOT pre-resolve).
    let threshold = ctx.punchConfig.faceMatchThreshold;
    if (threshold === undefined) {
      const config = await this.punchConfigRepo.findByTenantId(ctx.tenantId);
      threshold = config?.faceMatchThreshold ?? DEFAULT_FACE_MATCH_THRESHOLD;
    }

    // Normalize the selfie to Float32Array once; `Array.from` produces a
    // number[] — euclideanDistance accepts either, but the decrypt path
    // returns Float32Array so typed arithmetic is consistent.
    const selfie =
      ctx.faceEmbedding instanceof Float32Array
        ? ctx.faceEmbedding
        : Float32Array.from(ctx.faceEmbedding);

    // Decrypt + compare each enrollment. Min-distance policy (D-03).
    const distances = enrollments.map((e) => {
      const cadastral = faceEncryption.decryptEmbedding({
        ciphertext: e.embedding,
        iv: e.iv,
        authTag: e.authTag,
      });
      return euclideanDistance(selfie, cadastral);
    });

    const minDist = Math.min(...distances);

    if (minDist < threshold) {
      return { outcome: 'ACCEPT' };
    }

    return {
      outcome: 'APPROVAL_REQUIRED',
      approvalReason: 'FACE_MATCH_LOW',
      reason: `Face match abaixo do limiar (${minDist.toFixed(3)} >= ${threshold.toFixed(3)})`,
      details: {
        distance: Number(minDist.toFixed(4)),
        threshold,
        enrollmentCount: enrollments.length,
      },
    };
  }
}

/**
 * Euclidean distance between two 128-dimensional vectors. Exported for
 * spec coverage and for reuse by future antifraude consumers (Phase 9)
 * that may want to compute distances without running the full validator.
 *
 * Inputs are accepted as either Float32Array (decrypted enrollment) or
 * plain number[] (JSON payload from the kiosk); the loop reads positions
 * 0-127 so both containers work identically.
 */
export function euclideanDistance(
  a: Float32Array | number[],
  b: Float32Array | number[],
): number {
  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const d = (a[i] as number) - (b[i] as number);
    sum += d * d;
  }
  return Math.sqrt(sum);
}
