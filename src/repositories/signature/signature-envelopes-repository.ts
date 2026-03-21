import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEnvelope } from '@/entities/signature/signature-envelope';

export interface CreateSignatureEnvelopeSchema {
  tenantId: string;
  title: string;
  description?: string | null;
  status?: string;
  signatureLevel: string;
  minSignatureLevel?: string | null;
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
  findById(id: UniqueEntityID, tenantId: string): Promise<SignatureEnvelope | null>;
  findByIdWithRelations(id: UniqueEntityID, tenantId: string): Promise<SignatureEnvelope | null>;
  findMany(params: ListSignatureEnvelopesParams): Promise<FindManyEnvelopesResult>;
  update(data: UpdateSignatureEnvelopeSchema): Promise<SignatureEnvelope | null>;
  softDelete(id: UniqueEntityID): Promise<void>;
}
