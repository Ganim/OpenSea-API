import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';
import { SalesOrdersRepository } from '@/repositories/sales/sales-orders-repository';

interface UpdateSalesOrderStatusUseCaseRequest {
  id: string;
  status:
    | 'DRAFT'
    | 'PENDING'
    | 'CONFIRMED'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'RETURNED';
}

interface UpdateSalesOrderStatusUseCaseResponse {
  salesOrder: {
    id: string;
    orderNumber: string;
    status: string;
    customerId: string;
    totalPrice: number;
    discount: number;
    finalPrice: number;
    updatedAt: Date;
  };
}

export class UpdateSalesOrderStatusUseCase {
  constructor(private salesOrdersRepository: SalesOrdersRepository) {}

  async execute(
    input: UpdateSalesOrderStatusUseCaseRequest,
  ): Promise<UpdateSalesOrderStatusUseCaseResponse> {
    const order = await this.salesOrdersRepository.findById(
      new UniqueEntityID(input.id),
    );

    if (!order) {
      throw new ResourceNotFoundError('Sales order not found.');
    }

    // Validate status transitions
    const newStatus = OrderStatus.create(input.status);

    // Cannot change from a final status
    if (order.status.isFinal) {
      throw new BadRequestError(
        'Cannot change status of order in final status.',
      );
    }

    // Validate logical transitions
    if (order.status.isDraft && newStatus.isInTransit) {
      throw new BadRequestError('Cannot move from DRAFT to IN_TRANSIT.');
    }

    if (order.status.isDraft && newStatus.isDelivered) {
      throw new BadRequestError('Cannot move from DRAFT to DELIVERED.');
    }

    if (order.status.isPending && newStatus.isInTransit) {
      throw new BadRequestError('Order must be CONFIRMED before IN_TRANSIT.');
    }

    if (order.status.isPending && newStatus.isDelivered) {
      throw new BadRequestError('Order must be CONFIRMED before DELIVERED.');
    }

    order.status = newStatus;
    await this.salesOrdersRepository.save(order);

    return {
      salesOrder: {
        id: order.id.toString(),
        orderNumber: order.orderNumber,
        status: order.status.value,
        customerId: order.customerId.toString(),
        totalPrice: order.totalPrice,
        discount: order.discount,
        finalPrice: order.finalPrice,
        updatedAt: order.updatedAt ?? order.createdAt,
      },
    };
  }
}
