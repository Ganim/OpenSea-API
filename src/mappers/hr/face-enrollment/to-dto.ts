import type { FaceEnrollment } from '@/entities/hr/face-enrollment';

/**
 * HTTP-safe DTO for {@link FaceEnrollment}. Only metadata — NEVER exposes
 * cryptographic material:
 *   - embedding (ciphertext) — omitted
 *   - iv — omitted
 *   - authTag — omitted
 *   - consentAuditLogId — internal FK, not useful to the client
 *   - deletedAt — internal
 *
 * The e2e spec asserts `JSON.stringify(body).not.toContain('embedding')`
 * etc. as a sentinel against accidental leaks (pattern mirrored from
 * Phase 4 T-04-01 PunchDevice DTO).
 *
 * @see .planning/phases/05-kiosk-qr-face-match/05-03-PLAN.md dto_security_note
 */
export interface FaceEnrollmentDTO {
  id: string;
  employeeId: string;
  photoCount: number;
  capturedAt: string;
  capturedByUserId: string;
  createdAt: string;
}

export function faceEnrollmentToDto(e: FaceEnrollment): FaceEnrollmentDTO {
  return {
    id: e.id.toString(),
    employeeId: e.employeeId.toString(),
    photoCount: e.photoCount,
    capturedAt: e.capturedAt.toISOString(),
    capturedByUserId: e.capturedByUserId.toString(),
    createdAt: e.createdAt.toISOString(),
  };
}
