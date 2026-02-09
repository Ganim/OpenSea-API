import {
  type CostCenterDTO,
  costCenterToDTO,
} from '@/mappers/finance/cost-center/cost-center-to-dto';
import type { CostCentersRepository } from '@/repositories/finance/cost-centers-repository';

interface ListCostCentersUseCaseRequest {
  tenantId: string;
}

interface ListCostCentersUseCaseResponse {
  costCenters: CostCenterDTO[];
}

export class ListCostCentersUseCase {
  constructor(private costCentersRepository: CostCentersRepository) {}

  async execute({ tenantId }: ListCostCentersUseCaseRequest): Promise<ListCostCentersUseCaseResponse> {
    const costCenters = await this.costCentersRepository.findMany(tenantId);
    return { costCenters: costCenters.map(costCenterToDTO) };
  }
}
