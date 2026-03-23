import type { BidMonitorEvent } from '@/entities/sales/bid-monitor-event';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyBidMonitorEventsPaginatedParams {
  tenantId: string;
  bidId: string;
  page: number;
  limit: number;
  actionRequired?: boolean;
}

export interface BidMonitorEventsRepository {
  create(event: BidMonitorEvent): Promise<void>;
  findManyByBidId(
    params: FindManyBidMonitorEventsPaginatedParams,
  ): Promise<PaginatedResult<BidMonitorEvent>>;
}
