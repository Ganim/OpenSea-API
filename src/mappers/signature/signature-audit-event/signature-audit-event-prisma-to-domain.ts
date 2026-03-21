import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SignatureAuditEvent } from '@/entities/signature/signature-audit-event';
import type { SignatureAuditTypeValue } from '@/entities/signature/signature-audit-event';
import type { SignatureAuditEvent as PrismaAuditEvent } from '@prisma/generated/client.js';

export function signatureAuditEventPrismaToDomain(
  db: PrismaAuditEvent,
): SignatureAuditEvent {
  return SignatureAuditEvent.create(
    {
      id: new UniqueEntityID(db.id),
      envelopeId: db.envelopeId,
      tenantId: new UniqueEntityID(db.tenantId),
      type: db.type as SignatureAuditTypeValue,
      signerId: db.signerId,
      description: db.description,
      ipAddress: db.ipAddress,
      userAgent: db.userAgent,
      geoLatitude: db.geoLatitude ? Number(db.geoLatitude) : null,
      geoLongitude: db.geoLongitude ? Number(db.geoLongitude) : null,
      metadata: db.metadata as Record<string, unknown> | null,
      timestamp: db.timestamp,
    },
    new UniqueEntityID(db.id),
  );
}
