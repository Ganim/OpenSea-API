import type { Bid } from '@/entities/sales/bid';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { BidsRepository } from '@/repositories/sales/bids-repository';

interface ListBidsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  modality?: string;
  organState?: string;
  assignedToUserId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ListBidsUseCaseResponse {
  bids: Bid[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListBidsUseCase {
  constructor(private bidsRepository: BidsRepository) {}

  async execute(request: ListBidsUseCaseRequest): Promise<ListBidsUseCaseResponse> {
    const result: PaginatedResult<Bid> = await this.bidsRepository.findManyPaginated({
      tenantId: request.tenantId,
      page: request.page,
      limit: request.limit,
      search: request.search,
      status: request.status,
      modality: request.modality,
      organState: request.organState,
      assignedToUserId: request.assignedToUserId,
      sortBy: request.sortBy,
      sortOrder: request.sortOrder,
    });

    return {
      bids: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
