import {
  type CostCenterDTO,
  costCenterToDTO,
} from '@/mappers/finance/cost-center/cost-center-to-dto';
import type { CostCentersRepository } from '@/repositories/finance/cost-centers-repository';

interface ListCostCentersUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
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
  }: ListCostCentersUseCaseRequest): Promise<ListCostCentersUseCaseResponse> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);

    const { costCenters, total } =
      await this.costCentersRepository.findManyPaginated(
        tenantId,
        safePage,
        safeLimit,
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
