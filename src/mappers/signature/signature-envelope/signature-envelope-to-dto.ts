import type { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import type { SignatureEnvelopeSignerDTO } from '../signature-envelope-signer/signature-envelope-signer-to-dto';
import type { SignatureAuditEventDTO } from '../signature-audit-event/signature-audit-event-to-dto';
import { signatureEnvelopeSignerToDTO } from '../signature-envelope-signer/signature-envelope-signer-to-dto';
import { signatureAuditEventToDTO } from '../signature-audit-event/signature-audit-event-to-dto';

export interface SignatureEnvelopeDTO {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  status: string;
  signatureLevel: string;
  minSignatureLevel: string | null;
  verificationCode: string | null;
  documentFileId: string;
  documentHash: string;
  signedFileId: string | null;
  documentType: string;
  sourceModule: string;
  sourceEntityType: string;
  sourceEntityId: string;
  routingType: string;
  expiresAt: Date | null;
  reminderDays: number;
  autoExpireDays: number | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  createdByUserId: string;
  tags: string[];
  metadata: Record<string, unknown> | null;
  signers?: SignatureEnvelopeSignerDTO[];
  auditTrail?: SignatureAuditEventDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export function signatureEnvelopeToDTO(
  envelope: SignatureEnvelope,
): SignatureEnvelopeDTO {
  return {
    id: envelope.envelopeId.toString(),
    tenantId: envelope.tenantId.toString(),
    title: envelope.title,
    description: envelope.description,
    status: envelope.status,
    signatureLevel: envelope.signatureLevel,
    minSignatureLevel: envelope.minSignatureLevel,
    verificationCode: envelope.verificationCode,
    documentFileId: envelope.documentFileId,
    documentHash: envelope.documentHash,
    signedFileId: envelope.signedFileId,
    documentType: envelope.documentType,
    sourceModule: envelope.sourceModule,
    sourceEntityType: envelope.sourceEntityType,
    sourceEntityId: envelope.sourceEntityId,
    routingType: envelope.routingType,
    expiresAt: envelope.expiresAt,
    reminderDays: envelope.reminderDays,
    autoExpireDays: envelope.autoExpireDays,
    completedAt: envelope.completedAt,
    cancelledAt: envelope.cancelledAt,
    cancelReason: envelope.cancelReason,
    createdByUserId: envelope.createdByUserId,
    tags: envelope.tags,
    metadata: envelope.metadata,
    signers: envelope.signers?.map(signatureEnvelopeSignerToDTO),
    auditTrail: envelope.auditTrail?.map(signatureAuditEventToDTO),
    createdAt: envelope.createdAt,
    updatedAt: envelope.updatedAt,
  };
}
