import type { ProductionCost } from '@/entities/production/production-cost';
import type { ProductionCostsRepository } from '@/repositories/production/production-costs-repository';

interface ListProductionCostsUseCaseRequest {
  productionOrderId: string;
}

interface ListProductionCostsUseCaseResponse {
  costs: ProductionCost[];
}

export class ListProductionCostsUseCase {
  constructor(
    private productionCostsRepository: ProductionCostsRepository,
  ) {}

  async execute({
    productionOrderId,
  }: ListProductionCostsUseCaseRequest): Promise<ListProductionCostsUseCaseResponse> {
    const costs =
      await this.productionCostsRepository.findManyByOrderId(
        productionOrderId,
      );

    return { costs };
  }
}
