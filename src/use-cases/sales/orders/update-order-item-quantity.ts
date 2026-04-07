import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import type { OrderItem } from '@/entities/sales/order-item';
import type { OrderItemsRepository } from '@/repositories/sales/order-items-repository';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';

interface UpdateOrderItemQuantityUseCaseRequest {
  tenantId: string;
  orderId: string;
  itemId: string;
  quantity: number;
  isCashier?: boolean;
}

interface UpdateOrderItemQuantityUseCaseResponse {
  order: Order;
  orderItem: OrderItem;
}

export class UpdateOrderItemQuantityUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private orderItemsRepository: OrderItemsRepository,
  ) {}

  async execute(
    input: UpdateOrderItemQuantityUseCaseRequest,
  ): Promise<UpdateOrderItemQuantityUseCaseResponse> {
    if (input.quantity <= 0) {
      throw new BadRequestError('Quantity must be greater than zero.');
    }

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
        `Cannot update items on an order with status "${order.status}".`,
      );
    }

    const orderItem = await this.orderItemsRepository.findById(
      new UniqueEntityID(input.itemId),
      input.tenantId,
    );

    if (!orderItem) {
      throw new ResourceNotFoundError('Order item not found.');
    }

    if (orderItem.orderId.toString() !== input.orderId) {
      throw new BadRequestError('Item does not belong to this order.');
    }

    // Update quantity (setter validates > 0 and recalculates subtotal)
    orderItem.quantity = input.quantity;
    await this.orderItemsRepository.save(orderItem);

    // Recalculate order totals
    const allItems = await this.orderItemsRepository.findManyByOrder(
      order.id,
      input.tenantId,
    );

    this.recalculateOrderTotals(order, allItems);
    await this.ordersRepository.save(order);

    return { order, orderItem };
  }

  private recalculateOrderTotals(order: Order, items: OrderItem[]): void {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    order.subtotal = subtotal;
  }
}
