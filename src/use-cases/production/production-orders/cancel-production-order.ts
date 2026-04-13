import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionOrderStatus } from '@/entities/production/production-order';
import { ProductionOrdersRepository } from '@/repositories/production/production-orders-repository';

interface CancelProductionOrderUseCaseRequest {
  tenantId: string;
  id: string;
}

interface CancelProductionOrderUseCaseResponse {
  productionOrder: import('@/entities/production/production-order').ProductionOrder;
}

const CANCELLABLE_STATUSES: ProductionOrderStatus[] = [
  'DRAFT',
  'PLANNED',
  'FIRM',
  'RELEASED',
];

export class CancelProductionOrderUseCase {
  constructor(
    private productionOrdersRepository: ProductionOrdersRepository,
  ) {}

  async execute({
    tenantId,
    id,
  }: CancelProductionOrderUseCaseRequest): Promise<CancelProductionOrderUseCaseResponse> {
    const productionOrder = await this.productionOrdersRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!productionOrder) {
      throw new ResourceNotFoundError('Production order not found.');
    }

    if (!CANCELLABLE_STATUSES.includes(productionOrder.status)) {
      throw new BadRequestError(
        `Production order with status ${productionOrder.status} cannot be cancelled.`,
      );
    }

    productionOrder.cancel();

    const updatedOrder = await this.productionOrdersRepository.update({
      id: productionOrder.id,
      status: 'CANCELLED',
    });

    if (!updatedOrder) {
      throw new ResourceNotFoundError('Production order not found.');
    }

    return {
      productionOrder: updatedOrder,
    };
  }
}
