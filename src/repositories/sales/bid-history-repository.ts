import type { BidHistory } from '@/entities/sales/bid-history';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyBidHistoryPaginatedParams {
  tenantId: string;
  bidId: string;
  page: number;
  limit: number;
}

export interface BidHistoryRepository {
  create(history: BidHistory): Promise<void>;
  findManyByBidId(params: FindManyBidHistoryPaginatedParams): Promise<PaginatedResult<BidHistory>>;
}
