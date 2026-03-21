import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SignatureAuditEvent } from '@/entities/signature/signature-audit-event';
import type {
  CreateAuditEventSchema,
  SignatureAuditEventsRepository,
} from '../signature-audit-events-repository';

export class InMemorySignatureAuditEventsRepository
  implements SignatureAuditEventsRepository
{
  public items: SignatureAuditEvent[] = [];

  async create(data: CreateAuditEventSchema): Promise<SignatureAuditEvent> {
    const event = SignatureAuditEvent.create({
      envelopeId: data.envelopeId,
      tenantId: new UniqueEntityID(data.tenantId),
      type: data.type as SignatureAuditEvent['type'],
      signerId: data.signerId,
      description: data.description,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      geoLatitude: data.geoLatitude,
      geoLongitude: data.geoLongitude,
      metadata: data.metadata,
    });

    this.items.push(event);
    return event;
  }

  async findByEnvelopeId(envelopeId: string): Promise<SignatureAuditEvent[]> {
    return this.items
      .filter((item) => item.envelopeId === envelopeId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
}
