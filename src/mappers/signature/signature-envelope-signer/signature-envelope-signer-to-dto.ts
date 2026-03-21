import type { SignatureEnvelopeSigner } from '@/entities/signature/signature-envelope-signer';

export interface SignatureEnvelopeSignerDTO {
  id: string;
  tenantId: string;
  envelopeId: string;
  order: number;
  group: number;
  role: string;
  status: string;
  userId: string | null;
  contactId: string | null;
  externalName: string | null;
  externalEmail: string | null;
  externalPhone: string | null;
  externalDocument: string | null;
  signatureLevel: string;
  certificateId: string | null;
  signedAt: Date | null;
  signatureImageFileId: string | null;
  ipAddress: string | null;
  otpVerified: boolean;
  rejectedAt: Date | null;
  rejectedReason: string | null;
  lastNotifiedAt: Date | null;
  notificationCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function signatureEnvelopeSignerToDTO(
  signer: SignatureEnvelopeSigner,
): SignatureEnvelopeSignerDTO {
  return {
    id: signer.signerId.toString(),
    tenantId: signer.tenantId.toString(),
    envelopeId: signer.envelopeId,
    order: signer.order,
    group: signer.group,
    role: signer.role,
    status: signer.status,
    userId: signer.userId,
    contactId: signer.contactId,
    externalName: signer.externalName,
    externalEmail: signer.externalEmail,
    externalPhone: signer.externalPhone,
    externalDocument: signer.externalDocument,
    signatureLevel: signer.signatureLevel,
    certificateId: signer.certificateId,
    signedAt: signer.signedAt,
    signatureImageFileId: signer.signatureImageFileId,
    ipAddress: signer.ipAddress,
    otpVerified: signer.otpVerified,
    rejectedAt: signer.rejectedAt,
    rejectedReason: signer.rejectedReason,
    lastNotifiedAt: signer.lastNotifiedAt,
    notificationCount: signer.notificationCount,
    createdAt: signer.createdAt,
    updatedAt: signer.updatedAt,
  };
}
