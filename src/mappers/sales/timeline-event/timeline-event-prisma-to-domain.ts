import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimelineEvent } from '@/entities/sales/timeline-event';

export function timelineEventPrismaToDomain(
  data: Record<string, unknown>,
): TimelineEvent {
  return TimelineEvent.create(
    {
      tenantId: new UniqueEntityID(data.tenantId as string),
      dealId: new UniqueEntityID(data.dealId as string),
      type: data.type as string,
      title: data.title as string,
      metadata: (data.metadata as Record<string, unknown>) ?? undefined,
      userId: data.userId
        ? new UniqueEntityID(data.userId as string)
        : undefined,
      createdAt: data.createdAt as Date,
    },
    new UniqueEntityID(data.id as string),
  );
}
