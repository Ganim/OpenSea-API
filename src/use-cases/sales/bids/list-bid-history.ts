import type { BidHistory } from '@/entities/sales/bid-history';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { BidHistoryRepository } from '@/repositories/sales/bid-history-repository';

interface ListBidHistoryUseCaseRequest {
  tenantId: string;
  bidId: string;
  page: number;
  limit: number;
}

interface ListBidHistoryUseCaseResponse {
  history: BidHistory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListBidHistoryUseCase {
  constructor(private bidHistoryRepository: BidHistoryRepository) {}

  async execute(
    request: ListBidHistoryUseCaseRequest,
  ): Promise<ListBidHistoryUseCaseResponse> {
    const result: PaginatedResult<BidHistory> =
      await this.bidHistoryRepository.findManyByBidId({
        tenantId: request.tenantId,
        bidId: request.bidId,
        page: request.page,
        limit: request.limit,
      });

    return {
      history: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
