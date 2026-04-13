import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ProductionOrdersRepository } from '@/repositories/production/production-orders-repository';

interface UpdateProductionOrderUseCaseRequest {
  tenantId: string;
  id: string;
  priority?: number;
  quantityPlanned?: number;
  plannedStartDate?: Date | null;
  plannedEndDate?: Date | null;
  notes?: string | null;
}

interface UpdateProductionOrderUseCaseResponse {
  productionOrder: import('@/entities/production/production-order').ProductionOrder;
}

export class UpdateProductionOrderUseCase {
  constructor(private productionOrdersRepository: ProductionOrdersRepository) {}

  async execute({
    tenantId,
    id,
    priority,
    quantityPlanned,
    plannedStartDate,
    plannedEndDate,
    notes,
  }: UpdateProductionOrderUseCaseRequest): Promise<UpdateProductionOrderUseCaseResponse> {
    const productionOrder = await this.productionOrdersRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!productionOrder) {
      throw new ResourceNotFoundError('Production order not found.');
    }

    if (
      productionOrder.status !== 'DRAFT' &&
      productionOrder.status !== 'PLANNED'
    ) {
      throw new BadRequestError(
        'Production order can only be updated when status is DRAFT or PLANNED.',
      );
    }

    if (quantityPlanned !== undefined && quantityPlanned <= 0) {
      throw new BadRequestError('Quantity planned must be greater than zero.');
    }

    const updatedProductionOrder = await this.productionOrdersRepository.update(
      {
        id: new UniqueEntityID(id),
        priority,
        quantityPlanned,
        plannedStartDate,
        plannedEndDate,
        notes,
      },
    );

    if (!updatedProductionOrder) {
      throw new ResourceNotFoundError('Production order not found.');
    }

    return {
      productionOrder: updatedProductionOrder,
    };
  }
}
