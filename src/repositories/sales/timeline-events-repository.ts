import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TimelineEvent } from '@/entities/sales/timeline-event';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyTimelineEventsPaginatedParams {
  tenantId: string;
  contactId?: string;
  customerId?: string;
  dealId?: string;
  page: number;
  limit: number;
}

export interface TimelineEventsRepository {
  create(event: TimelineEvent): Promise<void>;
  findManyByDeal(dealId: string, tenantId: string): Promise<TimelineEvent[]>;
  findManyPaginated(
    params: FindManyTimelineEventsPaginatedParams,
  ): Promise<PaginatedResult<TimelineEvent>>;
  deleteByDeal(dealId: string): Promise<void>;
}
