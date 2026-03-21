import type { Deal } from '@/entities/sales/deal';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { DealsRepository } from '@/repositories/sales/deals-repository';

interface ListDealsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  pipelineId?: string;
  stageId?: string;
  status?: string;
  priority?: string;
  customerId?: string;
  assignedToUserId?: string;
  sortBy?: string;
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
        pipelineId: request.pipelineId,
        stageId: request.stageId,
        status: request.status,
        priority: request.priority,
        customerId: request.customerId,
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
