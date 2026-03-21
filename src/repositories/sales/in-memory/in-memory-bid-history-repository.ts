import type { BidHistory } from '@/entities/sales/bid-history';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  BidHistoryRepository,
  FindManyBidHistoryPaginatedParams,
} from '@/repositories/sales/bid-history-repository';

export class InMemoryBidHistoryRepository implements BidHistoryRepository {
  public items: BidHistory[] = [];

  async create(history: BidHistory): Promise<void> {
    this.items.push(history);
  }

  async findManyByBidId(
    params: FindManyBidHistoryPaginatedParams,
  ): Promise<PaginatedResult<BidHistory>> {
    const filtered = this.items.filter(
      (h) =>
        h.tenantId.toString() === params.tenantId &&
        h.bidId.toString() === params.bidId,
    );

    const sorted = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const total = sorted.length;
    const start = (params.page - 1) * params.limit;
    const data = sorted.slice(start, start + params.limit);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }
}
