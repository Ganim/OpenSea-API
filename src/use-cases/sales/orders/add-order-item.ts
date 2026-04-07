import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import { OrderItem } from '@/entities/sales/order-item';
import type { OrderItemsRepository } from '@/repositories/sales/order-items-repository';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import type { VariantsRepository } from '@/repositories/stock/variants-repository';

interface AddOrderItemUseCaseRequest {
  tenantId: string;
  orderId: string;
  variantId: string;
  quantity?: number;
  isCashier?: boolean;
}

interface AddOrderItemUseCaseResponse {
  order: Order;
  orderItem: OrderItem;
}

export class AddOrderItemUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private orderItemsRepository: OrderItemsRepository,
    private variantsRepository: VariantsRepository,
  ) {}

  async execute(
    input: AddOrderItemUseCaseRequest,
  ): Promise<AddOrderItemUseCaseResponse> {
    const requestedQuantity = input.quantity ?? 1;

    if (requestedQuantity <= 0) {
      throw new BadRequestError('Quantity must be greater than zero.');
    }

    // Load order
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(input.orderId),
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    // Validate order status
    const allowedStatuses = input.isCashier ? ['DRAFT', 'PENDING'] : ['DRAFT'];

    if (!allowedStatuses.includes(order.status)) {
      throw new BadRequestError(
        `Cannot add items to an order with status "${order.status}".`,
      );
    }

    // Load variant
    const variant = await this.variantsRepository.findById(
      new UniqueEntityID(input.variantId),
      input.tenantId,
    );

    if (!variant) {
      throw new ResourceNotFoundError('Product variant not found.');
    }

    if (!variant.isActive) {
      throw new BadRequestError('Product variant is not active.');
    }

    // Check if variant already in cart (merge behavior)
    const existingItems = await this.orderItemsRepository.findManyByOrder(
      order.id,
      input.tenantId,
    );

    const existingItemForVariant = existingItems.find(
      (item) => item.variantId?.toString() === input.variantId,
    );

    let orderItem: OrderItem;

    if (existingItemForVariant) {
      // Increment quantity on existing item
      existingItemForVariant.quantity =
        existingItemForVariant.quantity + requestedQuantity;
      await this.orderItemsRepository.save(existingItemForVariant);
      orderItem = existingItemForVariant;
    } else {
      // Create new order item with price snapshot
      orderItem = OrderItem.create({
        tenantId: new UniqueEntityID(input.tenantId),
        orderId: order.id,
        variantId: variant.id,
        name: variant.name,
        sku: variant.sku,
        quantity: requestedQuantity,
        unitPrice: variant.price,
        position: existingItems.length,
      });

      await this.orderItemsRepository.create(orderItem);
    }

    // Recalculate order totals
    const allItems = existingItemForVariant
      ? existingItems
      : [...existingItems, orderItem];

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
    // grandTotal is recalculated automatically via the setter:
    // grandTotal = subtotal - discountTotal + taxTotal + shippingTotal
  }
}
