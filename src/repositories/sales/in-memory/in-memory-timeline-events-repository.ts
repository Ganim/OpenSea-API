import type { TimelineEvent } from '@/entities/sales/timeline-event';
import type {
  PaginatedResult,
  PaginationParams,
} from '../../pagination-params';
import type {
  FindManyTimelineEventsOptions,
  TimelineEventsRepository,
} from '../timeline-events-repository';

export class InMemoryTimelineEventsRepository
  implements TimelineEventsRepository
{
  public items: TimelineEvent[] = [];

  private paginate(
    items: TimelineEvent[],
    params: PaginationParams,
  ): PaginatedResult<TimelineEvent> {
    const total = items.length;
    const start = (params.page - 1) * params.limit;
    return {
      data: items.slice(start, start + params.limit),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async create(event: TimelineEvent): Promise<void> {
    this.items.push(event);
  }

  async findManyPaginated(
    options: FindManyTimelineEventsOptions,
  ): Promise<PaginatedResult<TimelineEvent>> {
    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === options.tenantId,
    );

    if (options.contactId) {
      filtered = filtered.filter(
        (e) => e.contactId?.toString() === options.contactId,
      );
    }

    if (options.customerId) {
      filtered = filtered.filter(
        (e) => e.customerId?.toString() === options.customerId,
      );
    }

    if (options.dealId) {
      filtered = filtered.filter(
        (e) => e.dealId?.toString() === options.dealId,
      );
    }

    // Sort by createdAt desc by default
    filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return this.paginate(filtered, options);
  }
}
