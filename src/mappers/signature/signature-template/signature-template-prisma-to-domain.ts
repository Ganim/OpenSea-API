import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SignatureTemplate } from '@/entities/signature/signature-template';
import type { SignerSlot } from '@/entities/signature/signature-template';
import type { SignatureLevelValue, EnvelopeRoutingTypeValue } from '@/entities/signature/signature-envelope';
import type { SignatureTemplate as PrismaTemplate } from '@prisma/generated/client.js';

export function signatureTemplatePrismaToDomain(
  db: PrismaTemplate,
): SignatureTemplate {
  return SignatureTemplate.create(
    {
      id: new UniqueEntityID(db.id),
      tenantId: new UniqueEntityID(db.tenantId),
      name: db.name,
      description: db.description,
      signatureLevel: db.signatureLevel as SignatureLevelValue,
      routingType: db.routingType as EnvelopeRoutingTypeValue,
      signerSlots: db.signerSlots as unknown as SignerSlot[],
      expirationDays: db.expirationDays,
      reminderDays: db.reminderDays,
      isActive: db.isActive,
      createdAt: db.createdAt,
      updatedAt: db.updatedAt,
    },
    new UniqueEntityID(db.id),
  );
}
