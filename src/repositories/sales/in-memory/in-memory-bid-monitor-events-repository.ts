import type { BidMonitorEvent } from '@/entities/sales/bid-monitor-event';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  BidMonitorEventsRepository,
  FindManyBidMonitorEventsPaginatedParams,
} from '@/repositories/sales/bid-monitor-events-repository';

export class InMemoryBidMonitorEventsRepository implements BidMonitorEventsRepository {
  public items: BidMonitorEvent[] = [];

  async create(event: BidMonitorEvent): Promise<void> {
    this.items.push(event);
  }

  async findManyByBidId(
    params: FindManyBidMonitorEventsPaginatedParams,
  ): Promise<PaginatedResult<BidMonitorEvent>> {
    let filtered = this.items.filter(
      (e) =>
        e.tenantId.toString() === params.tenantId &&
        e.bidId.toString() === params.bidId,
    );

    if (params.actionRequired !== undefined) {
      filtered = filtered.filter((e) => e.actionRequired === params.actionRequired);
    }

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
}
