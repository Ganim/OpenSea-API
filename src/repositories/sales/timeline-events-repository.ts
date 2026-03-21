import type { TimelineEvent } from '@/entities/sales/timeline-event';
import type { PaginatedResult, PaginationParams } from '../pagination-params';

export interface FindManyTimelineEventsOptions extends PaginationParams {
  tenantId: string;
  contactId?: string;
  customerId?: string;
  dealId?: string;
}

export interface TimelineEventsRepository {
  create(event: TimelineEvent): Promise<void>;
  findManyPaginated(
    options: FindManyTimelineEventsOptions,
  ): Promise<PaginatedResult<TimelineEvent>>;
}
