import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionOrderStatus } from '@/entities/production/production-order';
import { ProductionOrdersRepository } from '@/repositories/production/production-orders-repository';

interface ChangeProductionOrderStatusUseCaseRequest {
  tenantId: string;
  id: string;
  targetStatus: ProductionOrderStatus;
  userId: string;
}

interface ChangeProductionOrderStatusUseCaseResponse {
  productionOrder: import('@/entities/production/production-order').ProductionOrder;
}

const VALID_TRANSITIONS: Record<ProductionOrderStatus, ProductionOrderStatus[]> = {
  DRAFT: ['PLANNED', 'CANCELLED'],
  PLANNED: ['FIRM', 'CANCELLED'],
  FIRM: ['RELEASED', 'CANCELLED'],
  RELEASED: ['IN_PROCESS', 'CANCELLED'],
  IN_PROCESS: ['TECHNICALLY_COMPLETE'],
  TECHNICALLY_COMPLETE: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

export class ChangeProductionOrderStatusUseCase {
  constructor(
    private productionOrdersRepository: ProductionOrdersRepository,
  ) {}

  async execute({
    tenantId,
    id,
    targetStatus,
    userId,
  }: ChangeProductionOrderStatusUseCaseRequest): Promise<ChangeProductionOrderStatusUseCaseResponse> {
    const productionOrder = await this.productionOrdersRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!productionOrder) {
      throw new ResourceNotFoundError('Production order not found.');
    }

    const currentStatus = productionOrder.status;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];

    if (!allowedTransitions.includes(targetStatus)) {
      throw new BadRequestError(
        `Invalid status transition from ${currentStatus} to ${targetStatus}.`,
      );
    }

    // Validate DRAFT → PLANNED requires bomId
    if (currentStatus === 'DRAFT' && targetStatus === 'PLANNED') {
      if (!productionOrder.bomId) {
        throw new BadRequestError(
          'Production order must have a BOM assigned before planning.',
        );
      }
    }

    // Apply transition using entity business methods
    switch (targetStatus) {
      case 'PLANNED':
        productionOrder.plan();
        break;
      case 'FIRM':
        productionOrder.firm();
        break;
      case 'RELEASED':
        productionOrder.release(userId);
        break;
      case 'IN_PROCESS':
        productionOrder.start();
        break;
      case 'TECHNICALLY_COMPLETE':
        productionOrder.complete();
        break;
      case 'CLOSED':
        productionOrder.close();
        break;
      case 'CANCELLED':
        productionOrder.cancel();
        break;
    }

    const updatedOrder = await this.productionOrdersRepository.update({
      id: productionOrder.id,
      status: productionOrder.status,
      releasedAt: productionOrder.releasedAt,
      releasedById: productionOrder.releasedById?.toString() ?? null,
      actualStartDate: productionOrder.actualStartDate,
      actualEndDate: productionOrder.actualEndDate,
    });

    if (!updatedOrder) {
      throw new ResourceNotFoundError('Production order not found.');
    }

    return {
      productionOrder: updatedOrder,
    };
  }
}
