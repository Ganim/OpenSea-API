import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TimelineEvent } from '@/entities/sales/timeline-event';

export interface TimelineEventsRepository {
  create(event: TimelineEvent): Promise<void>;
  findManyByDeal(dealId: string, tenantId: string): Promise<TimelineEvent[]>;
  deleteByDeal(dealId: string): Promise<void>;
}
