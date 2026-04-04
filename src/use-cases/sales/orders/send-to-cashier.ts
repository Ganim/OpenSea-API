import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import type { OrderItemsRepository } from '@/repositories/sales/order-items-repository';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';

interface SendToCashierUseCaseRequest {
  tenantId: string;
  orderId: string;
}

interface SendToCashierUseCaseResponse {
  order: Order;
}

export class SendToCashierUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private orderItemsRepository: OrderItemsRepository,
  ) {}

  async execute(
    input: SendToCashierUseCaseRequest,
  ): Promise<SendToCashierUseCaseResponse> {
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(input.orderId),
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    if (order.status !== 'DRAFT') {
      throw new BadRequestError(
        'Only orders with DRAFT status can be sent to cashier.',
      );
    }

    // Validate order has items
    const orderItems = await this.orderItemsRepository.findManyByOrder(
      order.id,
      input.tenantId,
    );

    if (orderItems.length === 0) {
      throw new BadRequestError(
        'Cannot send an empty order to cashier. Add at least one item.',
      );
    }

    // Generate sale code if missing
    if (!order.saleCode) {
      const saleCode = await this.generateUniqueSaleCode(input.tenantId);
      order.saleCode = saleCode;
    }

    // Transition to PENDING
    order.status = 'PENDING';

    await this.ordersRepository.save(order);

    return { order };
  }

  private async generateUniqueSaleCode(tenantId: string): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const maxRetries = 5;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const existing = await this.ordersRepository.findBySaleCode(
        code,
        tenantId,
      );

      if (!existing) {
        return code;
      }
    }

    // Fallback to 8-char code
    let fallbackCode = '';
    for (let i = 0; i < 8; i++) {
      fallbackCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return fallbackCode;
  }
}
