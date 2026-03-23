import type { BidContract } from '@/entities/sales/bid-contract';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { BidContractsRepository } from '@/repositories/sales/bid-contracts-repository';

interface ListBidContractsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  status?: string;
  bidId?: string;
}

interface ListBidContractsUseCaseResponse {
  contracts: BidContract[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListBidContractsUseCase {
  constructor(private bidContractsRepository: BidContractsRepository) {}

  async execute(
    request: ListBidContractsUseCaseRequest,
  ): Promise<ListBidContractsUseCaseResponse> {
    const result: PaginatedResult<BidContract> =
      await this.bidContractsRepository.findManyPaginated({
        tenantId: request.tenantId,
        page: request.page,
        limit: request.limit,
        status: request.status,
        bidId: request.bidId,
      });

    return {
      contracts: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
