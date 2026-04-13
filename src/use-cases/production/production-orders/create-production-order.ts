import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ProductionOrdersRepository } from '@/repositories/production/production-orders-repository';

interface CreateProductionOrderUseCaseRequest {
  tenantId: string;
  bomId: string;
  productId: string;
  quantityPlanned: number;
  priority?: number;
  salesOrderId?: string;
  parentOrderId?: string;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  notes?: string;
  createdById: string;
}

interface CreateProductionOrderUseCaseResponse {
  productionOrder: import('@/entities/production/production-order').ProductionOrder;
}

export class CreateProductionOrderUseCase {
  constructor(private productionOrdersRepository: ProductionOrdersRepository) {}

  async execute({
    tenantId,
    bomId,
    productId,
    quantityPlanned,
    priority = 0,
    salesOrderId,
    parentOrderId,
    plannedStartDate,
    plannedEndDate,
    notes,
    createdById,
  }: CreateProductionOrderUseCaseRequest): Promise<CreateProductionOrderUseCaseResponse> {
    if (quantityPlanned <= 0) {
      throw new BadRequestError('Quantity planned must be greater than zero.');
    }

    const orderNumber =
      await this.productionOrdersRepository.getNextOrderNumber(tenantId);

    const productionOrder = await this.productionOrdersRepository.create({
      tenantId,
      orderNumber,
      bomId,
      productId,
      quantityPlanned,
      priority,
      salesOrderId,
      parentOrderId,
      plannedStartDate,
      plannedEndDate,
      notes,
      createdById,
    });

    return {
      productionOrder,
    };
  }
}
