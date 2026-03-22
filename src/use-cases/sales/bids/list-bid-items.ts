import type { BidItem } from '@/entities/sales/bid-item';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { BidItemsRepository } from '@/repositories/sales/bid-items-repository';

interface ListBidItemsUseCaseRequest {
  tenantId: string;
  bidId: string;
  page: number;
  limit: number;
  status?: string;
}

interface ListBidItemsUseCaseResponse {
  items: BidItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListBidItemsUseCase {
  constructor(private bidItemsRepository: BidItemsRepository) {}

  async execute(request: ListBidItemsUseCaseRequest): Promise<ListBidItemsUseCaseResponse> {
    const result: PaginatedResult<BidItem> = await this.bidItemsRepository.findManyByBidId({
      tenantId: request.tenantId,
      bidId: request.bidId,
      page: request.page,
      limit: request.limit,
      status: request.status,
    });

    return {
      items: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
