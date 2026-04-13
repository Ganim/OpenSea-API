import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductionOrdersRepository } from '@/repositories/production/production-orders-repository';

interface GetProductionOrderByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetProductionOrderByIdUseCaseResponse {
  productionOrder: import('@/entities/production/production-order').ProductionOrder;
}

export class GetProductionOrderByIdUseCase {
  constructor(private productionOrdersRepository: ProductionOrdersRepository) {}

  async execute({
    tenantId,
    id,
  }: GetProductionOrderByIdUseCaseRequest): Promise<GetProductionOrderByIdUseCaseResponse> {
    const productionOrder = await this.productionOrdersRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!productionOrder) {
      throw new ResourceNotFoundError('Production order not found.');
    }

    return {
      productionOrder,
    };
  }
}
