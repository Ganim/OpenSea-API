import type { TimelineEvent } from '@/entities/sales/timeline-event';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyTimelineEventsPaginatedParams,
  TimelineEventsRepository,
} from '@/repositories/sales/timeline-events-repository';

export class InMemoryTimelineEventsRepository
  implements TimelineEventsRepository
{
  public items: TimelineEvent[] = [];

  async create(event: TimelineEvent): Promise<void> {
    this.items.push(event);
  }

  async findManyByDeal(
    dealId: string,
    tenantId: string,
  ): Promise<TimelineEvent[]> {
    return this.items
      .filter(
        (e) =>
          e.dealId.toString() === dealId && e.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findManyPaginated(
    params: FindManyTimelineEventsPaginatedParams,
  ): Promise<PaginatedResult<TimelineEvent>> {
    let filtered = this.items.filter(
      (e) => e.tenantId.toString() === params.tenantId,
    );

    if (params.dealId) {
      filtered = filtered.filter((e) => e.dealId.toString() === params.dealId);
    }

    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async deleteByDeal(dealId: string): Promise<void> {
    this.items = this.items.filter((e) => e.dealId.toString() !== dealId);
  }
}
