import type { ProductionCost } from '@/entities/production/production-cost';
import type { ProductionCostsRepository } from '@/repositories/production/production-costs-repository';

interface CalculateOrderCostUseCaseRequest {
  productionOrderId: string;
}

interface CalculateOrderCostUseCaseResponse {
  totalPlanned: number;
  totalActual: number;
  totalVariance: number;
  details: ProductionCost[];
}

export class CalculateOrderCostUseCase {
  constructor(
    private productionCostsRepository: ProductionCostsRepository,
  ) {}

  async execute({
    productionOrderId,
  }: CalculateOrderCostUseCaseRequest): Promise<CalculateOrderCostUseCaseResponse> {
    const details =
      await this.productionCostsRepository.findManyByOrderId(
        productionOrderId,
      );

    let totalPlanned = 0;
    let totalActual = 0;
    let totalVariance = 0;

    for (const cost of details) {
      totalPlanned += cost.plannedAmount;
      totalActual += cost.actualAmount;
      totalVariance += cost.varianceAmount;
    }

    return {
      totalPlanned,
      totalActual,
      totalVariance,
      details,
    };
  }
}
