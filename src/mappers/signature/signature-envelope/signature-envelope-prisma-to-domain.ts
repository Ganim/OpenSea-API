import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import type {
  EnvelopeStatusValue,
  SignatureLevelValue,
  EnvelopeRoutingTypeValue,
} from '@/entities/signature/signature-envelope';
import type {
  SignatureEnvelope as PrismaSignatureEnvelope,
  SignatureEnvelopeSigner as PrismaSignatureEnvelopeSigner,
  SignatureAuditEvent as PrismaSignatureAuditEvent,
} from '@prisma/generated/client.js';
import { signatureEnvelopeSignerPrismaToDomain } from '../signature-envelope-signer/signature-envelope-signer-prisma-to-domain';
import { signatureAuditEventPrismaToDomain } from '../signature-audit-event/signature-audit-event-prisma-to-domain';

type EnvelopeWithRelations = PrismaSignatureEnvelope & {
  signers?: PrismaSignatureEnvelopeSigner[];
  auditTrail?: PrismaSignatureAuditEvent[];
};

export function signatureEnvelopePrismaToDomain(
  db: EnvelopeWithRelations,
): SignatureEnvelope {
  return SignatureEnvelope.create(
    {
      id: new UniqueEntityID(db.id),
      tenantId: new UniqueEntityID(db.tenantId),
      title: db.title,
      description: db.description,
      status: db.status as EnvelopeStatusValue,
      signatureLevel: db.signatureLevel as SignatureLevelValue,
      minSignatureLevel: db.minSignatureLevel as SignatureLevelValue | null,
      verificationCode: db.verificationCode ?? null,
      documentFileId: db.documentFileId,
      documentHash: db.documentHash,
      signedFileId: db.signedFileId,
      documentType: db.documentType,
      sourceModule: db.sourceModule,
      sourceEntityType: db.sourceEntityType,
      sourceEntityId: db.sourceEntityId,
      routingType: db.routingType as EnvelopeRoutingTypeValue,
      expiresAt: db.expiresAt,
      reminderDays: db.reminderDays,
      autoExpireDays: db.autoExpireDays,
      completedAt: db.completedAt,
      cancelledAt: db.cancelledAt,
      cancelReason: db.cancelReason,
      createdByUserId: db.createdByUserId,
      tags: db.tags,
      metadata: db.metadata as Record<string, unknown> | null,
      signers: db.signers?.map(signatureEnvelopeSignerPrismaToDomain),
      auditTrail: db.auditTrail?.map(signatureAuditEventPrismaToDomain),
      deletedAt: db.deletedAt,
      createdAt: db.createdAt,
      updatedAt: db.updatedAt,
    },
    new UniqueEntityID(db.id),
  );
}
