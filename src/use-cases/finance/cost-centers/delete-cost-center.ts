import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CostCentersRepository } from '@/repositories/finance/cost-centers-repository';

interface DeleteCostCenterUseCaseRequest {
  tenantId: string;
  id: string;
}

export class DeleteCostCenterUseCase {
  constructor(private costCentersRepository: CostCentersRepository) {}

  async execute({
    tenantId,
    id,
  }: DeleteCostCenterUseCaseRequest): Promise<void> {
    const costCenter = await this.costCentersRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!costCenter) {
      throw new ResourceNotFoundError('Cost center not found');
    }

    await this.costCentersRepository.delete(new UniqueEntityID(id));
  }
}
