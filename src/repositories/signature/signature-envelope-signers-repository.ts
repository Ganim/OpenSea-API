import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEnvelopeSigner } from '@/entities/signature/signature-envelope-signer';

export interface CreateSignerSchema {
  tenantId: string;
  envelopeId: string;
  order?: number;
  group?: number;
  role?: string;
  status?: string;
  userId?: string | null;
  contactId?: string | null;
  externalName?: string | null;
  externalEmail?: string | null;
  externalPhone?: string | null;
  externalDocument?: string | null;
  signatureLevel: string;
  certificateId?: string | null;
  accessToken?: string | null;
  accessTokenExpiresAt?: Date | null;
}

export interface UpdateSignerSchema {
  id: string;
  status?: string;
  signedAt?: Date | null;
  signatureImageFileId?: string | null;
  signatureData?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  geoLatitude?: number | null;
  geoLongitude?: number | null;
  otpVerified?: boolean;
  rejectedAt?: Date | null;
  rejectedReason?: string | null;
  lastNotifiedAt?: Date | null;
  notificationCount?: number;
}

export interface SignatureEnvelopeSignersRepository {
  create(data: CreateSignerSchema): Promise<SignatureEnvelopeSigner>;
  createMany(data: CreateSignerSchema[]): Promise<SignatureEnvelopeSigner[]>;
  findById(id: UniqueEntityID): Promise<SignatureEnvelopeSigner | null>;
  findByAccessToken(token: string): Promise<SignatureEnvelopeSigner | null>;
  findByEnvelopeId(envelopeId: string): Promise<SignatureEnvelopeSigner[]>;
  findPendingByEnvelopeAndGroup(
    envelopeId: string,
    group: number,
  ): Promise<SignatureEnvelopeSigner[]>;
  update(data: UpdateSignerSchema): Promise<SignatureEnvelopeSigner | null>;
  updateManyStatus(envelopeId: string, status: string): Promise<void>;
}
