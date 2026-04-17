import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SignatureEnvelopeSigner } from '@/entities/signature/signature-envelope-signer';
import type {
  SignerRoleValue,
  SignerStatusValue,
} from '@/entities/signature/signature-envelope-signer';
import type { SignatureLevelValue } from '@/entities/signature/signature-envelope';
import type { SignatureEnvelopeSigner as PrismaSigner } from '@prisma/generated/client.js';

export function signatureEnvelopeSignerPrismaToDomain(
  db: PrismaSigner,
): SignatureEnvelopeSigner {
  return SignatureEnvelopeSigner.create(
    {
      id: new UniqueEntityID(db.id),
      tenantId: new UniqueEntityID(db.tenantId),
      envelopeId: db.envelopeId,
      order: db.order,
      group: db.group,
      role: db.role as SignerRoleValue,
      status: db.status as SignerStatusValue,
      userId: db.userId,
      contactId: db.contactId,
      externalName: db.externalName,
      externalEmail: db.externalEmail,
      externalPhone: db.externalPhone,
      externalDocument: db.externalDocument,
      signatureLevel: db.signatureLevel as SignatureLevelValue,
      certificateId: db.certificateId,
      accessToken: db.accessToken,
      accessTokenExpiresAt: db.accessTokenExpiresAt,
      signedAt: db.signedAt,
      signatureImageFileId: db.signatureImageFileId,
      signatureData: db.signatureData as Record<string, unknown> | null,
      ipAddress: db.ipAddress,
      userAgent: db.userAgent,
      geoLatitude: db.geoLatitude ? Number(db.geoLatitude) : null,
      geoLongitude: db.geoLongitude ? Number(db.geoLongitude) : null,
      otpVerified: db.otpVerified,
      otpCodeHash: db.otpCodeHash ?? null,
      otpExpiresAt: db.otpExpiresAt ?? null,
      otpAttempts: db.otpAttempts,
      otpSentAt: db.otpSentAt ?? null,
      rejectedAt: db.rejectedAt,
      rejectedReason: db.rejectedReason,
      lastNotifiedAt: db.lastNotifiedAt,
      notificationCount: db.notificationCount,
      createdAt: db.createdAt,
      updatedAt: db.updatedAt,
    },
    new UniqueEntityID(db.id),
  );
}
