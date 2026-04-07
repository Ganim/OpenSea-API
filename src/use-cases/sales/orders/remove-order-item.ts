import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import type { OrderItem } from '@/entities/sales/order-item';
import type { OrderItemsRepository } from '@/repositories/sales/order-items-repository';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';

interface RemoveOrderItemUseCaseRequest {
  tenantId: string;
  orderId: string;
  itemId: string;
  isCashier?: boolean;
}

interface RemoveOrderItemUseCaseResponse {
  order: Order;
}

export class RemoveOrderItemUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private orderItemsRepository: OrderItemsRepository,
  ) {}

  async execute(
    input: RemoveOrderItemUseCaseRequest,
  ): Promise<RemoveOrderItemUseCaseResponse> {
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(input.orderId),
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    const allowedStatuses = input.isCashier ? ['DRAFT', 'PENDING'] : ['DRAFT'];

    if (!allowedStatuses.includes(order.status)) {
      throw new BadRequestError(
        `Cannot remove items from an order with status "${order.status}".`,
      );
    }

    const itemToRemove = await this.orderItemsRepository.findById(
      new UniqueEntityID(input.itemId),
      input.tenantId,
    );

    if (!itemToRemove) {
      throw new ResourceNotFoundError('Order item not found.');
    }

    if (itemToRemove.orderId.toString() !== input.orderId) {
      throw new BadRequestError('Item does not belong to this order.');
    }

    await this.orderItemsRepository.delete(
      new UniqueEntityID(input.itemId),
      input.tenantId,
    );

    // Recalculate totals with remaining items
    const remainingItems = await this.orderItemsRepository.findManyByOrder(
      order.id,
      input.tenantId,
    );

    this.recalculateOrderTotals(order, remainingItems);
    await this.ordersRepository.save(order);

    return { order };
  }

  private recalculateOrderTotals(order: Order, items: OrderItem[]): void {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    order.subtotal = subtotal;
  }
}
