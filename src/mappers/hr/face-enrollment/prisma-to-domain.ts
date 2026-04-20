import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FaceEnrollment } from '@/entities/hr/face-enrollment';
import type { EmployeeFaceEnrollment as PrismaFaceEnrollment } from '@prisma/generated/client.js';

/**
 * Maps a Prisma row to the domain entity, preserving ciphertext.
 *
 * IMPORTANT: this mapper does NOT call `decryptEmbedding`. Plaintext is only
 * materialized at the FaceMatchValidator (Plan 05-07) boundary, keeping the
 * decryption window as narrow as possible. DTO mapper in `to-dto.ts` strips
 * embedding/iv/authTag before serializing to the HTTP client (T-FACE-03).
 *
 * @see .planning/phases/05-kiosk-qr-face-match/05-PATTERNS.md §3
 */
export function mapFaceEnrollmentPrismaToDomain(
  row: PrismaFaceEnrollment,
): FaceEnrollment {
  // Prisma returns `Uint8Array` for Bytes columns; our entity stores `Buffer`
  // so downstream consumers (e.g. FaceMatchValidator) can rely on Buffer's
  // richer API (concat, slice-without-copy). `Buffer.from` without copying
  // is a no-op when the source is already a Buffer, but when it's a raw
  // Uint8Array it wraps the same backing ArrayBuffer (no data duplication).
  return FaceEnrollment.create(
    {
      tenantId: new UniqueEntityID(row.tenantId),
      employeeId: new UniqueEntityID(row.employeeId),
      embedding: Buffer.from(row.embedding),
      iv: Buffer.from(row.iv),
      authTag: Buffer.from(row.authTag),
      photoCount: row.photoCount,
      capturedAt: row.capturedAt,
      capturedByUserId: new UniqueEntityID(row.capturedByUserId),
      consentAuditLogId: row.consentAuditLogId,
      createdAt: row.createdAt,
      deletedAt: row.deletedAt ?? undefined,
    },
    new UniqueEntityID(row.id),
  );
}
