import {
  type CostCenterDTO,
  costCenterToDTO,
} from '@/mappers/finance/cost-center/cost-center-to-dto';
import type { CostCentersRepository } from '@/repositories/finance/cost-centers-repository';

interface ListCostCentersUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  // P1-37: orphan params plumbed end-to-end.
  companyId?: string;
  includeDeleted?: boolean | 'only';
  sortBy?: 'name' | 'code' | 'createdAt' | 'monthlyBudget' | 'annualBudget';
  sortOrder?: 'asc' | 'desc';
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface ListCostCentersUseCaseResponse {
  costCenters: CostCenterDTO[];
  meta: PaginationMeta;
}

export class ListCostCentersUseCase {
  constructor(private costCentersRepository: CostCentersRepository) {}

  async execute({
    tenantId,
    page = 1,
    limit = 20,
    search,
    isActive,
    companyId,
    includeDeleted,
    sortBy,
    sortOrder,
  }: ListCostCentersUseCaseRequest): Promise<ListCostCentersUseCaseResponse> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);

    const { costCenters, total } =
      await this.costCentersRepository.findManyPaginated(
        tenantId,
        safePage,
        safeLimit,
        {
          search,
          isActive,
          companyId,
          includeDeleted,
          sortBy,
          sortOrder,
        },
      );

    return {
      costCenters: costCenters.map(costCenterToDTO),
      meta: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit) || 1,
      },
    };
  }
}
