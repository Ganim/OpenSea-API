import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OrderStatus } from '@/entities/sales/value-objects/order-status';
import { SalesOrdersRepository } from '@/repositories/sales/sales-orders-repository';

interface UpdateSalesOrderStatusUseCaseRequest {
  tenantId: string;
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
    createdBy: string | null;
    totalPrice: number;
    discount: number;
    finalPrice: number;
    notes: string | null;
    items: Array<{
      id: string;
      variantId: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      totalPrice: number;
      notes: string | null;
    }>;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  };
}

export class UpdateSalesOrderStatusUseCase {
  constructor(private salesOrdersRepository: SalesOrdersRepository) {}

  async execute(
    input: UpdateSalesOrderStatusUseCaseRequest,
  ): Promise<UpdateSalesOrderStatusUseCaseResponse> {
    const order = await this.salesOrdersRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
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
        createdBy: order.createdBy?.toString() ?? null,
        totalPrice: order.totalPrice,
        discount: order.discount,
        finalPrice: order.finalPrice,
        notes: order.notes ?? null,
        items: order.items.map((item) => ({
          id: item.id.toString(),
          variantId: item.variantId.toString(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          totalPrice: item.totalPrice,
          notes: item.notes ?? null,
        })),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt ?? order.createdAt,
        deletedAt: order.deletedAt ?? null,
      },
    };
  }
}
