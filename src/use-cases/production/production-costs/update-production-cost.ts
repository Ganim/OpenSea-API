import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionCost } from '@/entities/production/production-cost';
import type { ProductionCostsRepository } from '@/repositories/production/production-costs-repository';

interface UpdateProductionCostUseCaseRequest {
  id: string;
  costType?: 'MATERIAL' | 'LABOR' | 'OVERHEAD';
  description?: string | null;
  plannedAmount?: number;
  actualAmount?: number;
}

interface UpdateProductionCostUseCaseResponse {
  cost: ProductionCost;
}

export class UpdateProductionCostUseCase {
  constructor(
    private productionCostsRepository: ProductionCostsRepository,
  ) {}

  async execute({
    id,
    costType,
    description,
    plannedAmount,
    actualAmount,
  }: UpdateProductionCostUseCaseRequest): Promise<UpdateProductionCostUseCaseResponse> {
    const existing = await this.productionCostsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!existing) {
      throw new Error('Production cost not found');
    }

    const finalPlanned = plannedAmount ?? existing.plannedAmount;
    const finalActual = actualAmount ?? existing.actualAmount;
    const varianceAmount = finalActual - finalPlanned;

    const cost = await this.productionCostsRepository.update({
      id: new UniqueEntityID(id),
      costType,
      description,
      plannedAmount,
      actualAmount,
      varianceAmount,
    });

    if (!cost) {
      throw new Error('Failed to update production cost');
    }

    return { cost };
  }
}
