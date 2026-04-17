import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEnvelope } from '@/entities/signature/signature-envelope';

export interface CreateSignatureEnvelopeSchema {
  tenantId: string;
  title: string;
  description?: string | null;
  status?: string;
  signatureLevel: string;
  minSignatureLevel?: string | null;
  verificationCode?: string | null;
  documentFileId: string;
  documentHash: string;
  documentType?: string;
  sourceModule: string;
  sourceEntityType: string;
  sourceEntityId: string;
  routingType: string;
  expiresAt?: Date | null;
  reminderDays?: number;
  autoExpireDays?: number | null;
  createdByUserId: string;
  tags?: string[];
  metadata?: Record<string, unknown> | null;
}

export interface UpdateSignatureEnvelopeSchema {
  id: string;
  status?: string;
  signedFileId?: string | null;
  completedAt?: Date | null;
  cancelledAt?: Date | null;
  cancelReason?: string | null;
}

export interface ListSignatureEnvelopesParams {
  tenantId: string;
  status?: string;
  sourceModule?: string;
  createdByUserId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface FindManyEnvelopesResult {
  envelopes: SignatureEnvelope[];
  total: number;
}

export interface SignatureEnvelopesRepository {
  create(data: CreateSignatureEnvelopeSchema): Promise<SignatureEnvelope>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SignatureEnvelope | null>;
  findByIdWithRelations(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SignatureEnvelope | null>;
  /**
   * Finds an envelope globally (no tenant scope) by its verification code.
   * Used by the public /v1/signature/verify/:code endpoint. Returning
   * cross-tenant is OK because the code itself is the shared secret and
   * the response only exposes non-sensitive audit data.
   */
  findByVerificationCode(
    verificationCode: string,
  ): Promise<SignatureEnvelope | null>;
  findMany(
    params: ListSignatureEnvelopesParams,
  ): Promise<FindManyEnvelopesResult>;
  /**
   * Finds envelopes that have passed their expiration date and are still in
   * an actionable status (PENDING or IN_PROGRESS). Used by the auto-expire
   * cron so we can transition them to EXPIRED in a single sweep. Deleted
   * envelopes are skipped so re-running is idempotent.
   */
  findExpiredActive(referenceDate: Date): Promise<SignatureEnvelope[]>;
  /**
   * Finds envelopes that are actively in progress and whose reminder cadence
   * allows another nudge for at least one pending signer. The cron does a
   * per-signer age check afterwards; this query narrows down the candidate
   * set (IN_PROGRESS + not yet expired) so the job doesn't scan finished
   * envelopes.
   */
  findRemindableInProgress(referenceDate: Date): Promise<SignatureEnvelope[]>;
  update(
    data: UpdateSignatureEnvelopeSchema,
  ): Promise<SignatureEnvelope | null>;
  softDelete(id: UniqueEntityID): Promise<void>;
}
