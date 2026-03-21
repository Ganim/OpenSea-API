import type { SignatureAuditEvent } from '@/entities/signature/signature-audit-event';
import { prisma } from '@/lib/prisma';
import { signatureAuditEventPrismaToDomain } from '@/mappers/signature';
import type { SignatureAuditType } from '@prisma/generated/client.js';
import type {
  CreateAuditEventSchema,
  SignatureAuditEventsRepository,
} from '../signature-audit-events-repository';

export class PrismaSignatureAuditEventsRepository
  implements SignatureAuditEventsRepository
{
  async create(data: CreateAuditEventSchema): Promise<SignatureAuditEvent> {
    const db = await prisma.signatureAuditEvent.create({
      data: {
        envelopeId: data.envelopeId,
        tenantId: data.tenantId,
        type: data.type as SignatureAuditType,
        signerId: data.signerId ?? null,
        description: data.description,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        geoLatitude: data.geoLatitude ?? null,
        geoLongitude: data.geoLongitude ?? null,
        metadata: (data.metadata as object) ?? undefined,
      },
    });
    return signatureAuditEventPrismaToDomain(db);
  }

  async findByEnvelopeId(envelopeId: string): Promise<SignatureAuditEvent[]> {
    const items = await prisma.signatureAuditEvent.findMany({
      where: { envelopeId },
      orderBy: { timestamp: 'asc' },
    });
    return items.map(signatureAuditEventPrismaToDomain);
  }
}
