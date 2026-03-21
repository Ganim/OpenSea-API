import type { Deal } from '@/entities/sales/deal';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { DealsRepository } from '@/repositories/sales/deals-repository';

interface ListDealsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  customerId?: string;
  pipelineId?: string;
  stageId?: string;
  status?: string;
  assignedToUserId?: string;
  sortBy?: 'title' | 'value' | 'createdAt' | 'updatedAt' | 'expectedCloseDate';
  sortOrder?: 'asc' | 'desc';
}

interface ListDealsUseCaseResponse {
  deals: Deal[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListDealsUseCase {
  constructor(private dealsRepository: DealsRepository) {}

  async execute(
    request: ListDealsUseCaseRequest,
  ): Promise<ListDealsUseCaseResponse> {
    const result: PaginatedResult<Deal> =
      await this.dealsRepository.findManyPaginated({
        tenantId: request.tenantId,
        page: request.page,
        limit: request.limit,
        search: request.search,
        customerId: request.customerId,
        pipelineId: request.pipelineId,
        stageId: request.stageId,
        status: request.status,
        assignedToUserId: request.assignedToUserId,
        sortBy: request.sortBy,
        sortOrder: request.sortOrder,
      });

    return {
      deals: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
