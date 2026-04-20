import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

/**
 * Face enrollment domain entity (Phase 5 / Plan 05-03).
 *
 * The entity carries ENCRYPTED embedding bytes, never plaintext. The mapper
 * at the Prisma boundary keeps ciphertext (embedding + iv + authTag) and
 * decryption is deferred to the FaceMatchValidator in Plan 05-07 — the only
 * runtime consumer that ever needs the plaintext 128-d vector.
 *
 * @see .planning/phases/05-kiosk-qr-face-match/05-PATTERNS.md §1
 * @see OpenSea-API/src/lib/face-encryption.ts (AES-256-GCM helper)
 */
export interface FaceEnrollmentProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  employeeId: UniqueEntityID;
  /** AES-256-GCM ciphertext bytes of the 128-d Float32Array embedding. */
  embedding: Buffer;
  /** 96-bit (12-byte) IV, unique per row. */
  iv: Buffer;
  /** 128-bit (16-byte) GCM authentication tag. */
  authTag: Buffer;
  /** 1-indexed position within a 3-5 capture batch (rastreabilidade). */
  photoCount: number;
  capturedAt: Date;
  /** Admin user who captured the enrollment (D-05: admin-only flow). */
  capturedByUserId: UniqueEntityID;
  /**
   * Foreign key to AuditLog row that recorded the LGPD consent acceptance
   * (D-07). Nullable for legacy rows or when the controller fails to write
   * the consent audit log before the enrollment — the use case treats the
   * consent audit log as a hard precondition, so null only appears in tests.
   */
  consentAuditLogId: string | null;
  createdAt: Date;
  deletedAt?: Date;
}

export class FaceEnrollment extends Entity<FaceEnrollmentProps> {
  get tenantId() {
    return this.props.tenantId;
  }

  get employeeId() {
    return this.props.employeeId;
  }

  get embedding() {
    return this.props.embedding;
  }

  get iv() {
    return this.props.iv;
  }

  get authTag() {
    return this.props.authTag;
  }

  get photoCount() {
    return this.props.photoCount;
  }

  get capturedAt() {
    return this.props.capturedAt;
  }

  get capturedByUserId() {
    return this.props.capturedByUserId;
  }

  get consentAuditLogId() {
    return this.props.consentAuditLogId;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get deletedAt() {
    return this.props.deletedAt;
  }

  /**
   * LGPD-compliant soft-delete. Row stays in the DB (audit / retention) but
   * is filtered out by `deletedAt IS NULL` in every lookup. Downstream
   * FaceMatchValidator (Plan 05-07) will therefore treat a soft-deleted
   * employee as "no enrollment" and throw FaceEnrollmentRequiredError.
   */
  softDelete() {
    this.props.deletedAt = new Date();
  }

  static create(
    props: Optional<
      FaceEnrollmentProps,
      'id' | 'createdAt' | 'deletedAt' | 'consentAuditLogId'
    >,
    id?: UniqueEntityID,
  ) {
    return new FaceEnrollment(
      {
        ...props,
        id: props.id ?? new UniqueEntityID(),
        createdAt: props.createdAt ?? new Date(),
        consentAuditLogId: props.consentAuditLogId ?? null,
      },
      id ?? props.id,
    );
  }
}
