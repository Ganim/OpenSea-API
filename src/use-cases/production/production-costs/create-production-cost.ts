import type { ProductionCost } from '@/entities/production/production-cost';
import type { ProductionCostsRepository } from '@/repositories/production/production-costs-repository';

interface CreateProductionCostUseCaseRequest {
  productionOrderId: string;
  costType: 'MATERIAL' | 'LABOR' | 'OVERHEAD';
  description?: string;
  plannedAmount: number;
  actualAmount: number;
}

interface CreateProductionCostUseCaseResponse {
  cost: ProductionCost;
}

export class CreateProductionCostUseCase {
  constructor(private productionCostsRepository: ProductionCostsRepository) {}

  async execute({
    productionOrderId,
    costType,
    description,
    plannedAmount,
    actualAmount,
  }: CreateProductionCostUseCaseRequest): Promise<CreateProductionCostUseCaseResponse> {
    const varianceAmount = actualAmount - plannedAmount;

    const cost = await this.productionCostsRepository.create({
      productionOrderId,
      costType,
      description,
      plannedAmount,
      actualAmount,
      varianceAmount,
    });

    return { cost };
  }
}
