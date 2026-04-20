/**
 * Phase 5 / Plan 05-01 / Task 4 — Face enrollment factory.
 *
 * Builds realistic encrypted EmployeeFaceEnrollment fixtures for unit and
 * e2e tests without forcing every spec to know the AES-256-GCM contract.
 *
 * USAGE:
 *   import { makeFaceEnrollmentProps } from '@/utils/tests/factories/hr/make-face-enrollment';
 *   const data = makeFaceEnrollmentProps({ tenantId, employeeId });
 *   await prisma.employeeFaceEnrollment.create({ data: { ...data } });
 *
 *   // Or, when only the embedding pair matters:
 *   const { plaintext, ciphertext, iv, authTag } = makeEncryptedEmbedding();
 *   const decrypted = decryptEmbedding({ ciphertext, iv, authTag });
 *   expect(decrypted).toEqual(plaintext);
 *
 * REQUIREMENTS:
 *   `process.env.FACE_ENROLLMENT_ENCRYPTION_KEY` MUST be set before any
 *   call to {@link makeEncryptedEmbedding} / {@link makeFaceEnrollmentProps}.
 *   Production-shaped key generation:
 *     `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
 *   Vitest setup files should set the env var globally; otherwise wrap
 *   tests in a `beforeAll` that sets it.
 *
 * NOTE on plan path:
 *   Plan 05-01 frontmatter referenced `src/test/factories/face-enrollment.factory.ts`,
 *   but the project's actual convention (verified across 60+ existing factories)
 *   is `src/utils/tests/factories/{module}/make-{thing}.ts`. This file follows
 *   the convention used by `make-employee.ts`, `make-absence.ts`, etc.
 *   See SUMMARY for the full deviation entry.
 */

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { encryptEmbedding } from '@/lib/face-encryption';

export function makeRandomEmbedding(): Float32Array {
  const arr = new Float32Array(128);
  for (let i = 0; i < 128; i++) {
    arr[i] = Math.random() * 2 - 1;
  }
  return arr;
}

export interface MakeEncryptedEmbeddingResult {
  plaintext: Float32Array;
  ciphertext: Buffer;
  iv: Buffer;
  authTag: Buffer;
}

export function makeEncryptedEmbedding(
  embedding?: Float32Array,
): MakeEncryptedEmbeddingResult {
  const plaintext = embedding ?? makeRandomEmbedding();
  const encrypted = encryptEmbedding(plaintext);
  return { plaintext, ...encrypted };
}

export interface MakeFaceEnrollmentPropsOverride {
  id?: string;
  tenantId?: string;
  employeeId?: string;
  photoCount?: number;
  capturedAt?: Date;
  capturedByUserId?: string;
  consentAuditLogId?: string | null;
  embedding?: Float32Array;
}

export interface MakeFaceEnrollmentPropsResult {
  id: string;
  tenantId: string;
  employeeId: string;
  embedding: Buffer;
  iv: Buffer;
  authTag: Buffer;
  photoCount: number;
  capturedAt: Date;
  capturedByUserId: string;
  consentAuditLogId: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  /** Convenience for tests to assert decryption round-trip — NOT a DB column. */
  _plaintextEmbedding: Float32Array;
}

/**
 * Builds a fully-populated set of enrollment props ready to pass to
 * `prisma.employeeFaceEnrollment.create({ data: ... })`. The
 * `_plaintextEmbedding` field is included so callers can assert that
 * `decryptEmbedding(persistedRow)` round-trips to the same vector.
 */
export function makeFaceEnrollmentProps(
  override: MakeFaceEnrollmentPropsOverride = {},
): MakeFaceEnrollmentPropsResult {
  const { plaintext, ciphertext, iv, authTag } = makeEncryptedEmbedding(
    override.embedding,
  );
  return {
    id: override.id ?? new UniqueEntityID().toString(),
    tenantId: override.tenantId ?? new UniqueEntityID().toString(),
    employeeId: override.employeeId ?? new UniqueEntityID().toString(),
    embedding: ciphertext,
    iv,
    authTag,
    photoCount: override.photoCount ?? 1,
    capturedAt: override.capturedAt ?? new Date(),
    capturedByUserId:
      override.capturedByUserId ?? new UniqueEntityID().toString(),
    consentAuditLogId: override.consentAuditLogId ?? null,
    createdAt: new Date(),
    deletedAt: null,
    _plaintextEmbedding: plaintext,
  };
}
