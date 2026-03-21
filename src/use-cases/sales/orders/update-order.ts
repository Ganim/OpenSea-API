import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order, DeliveryMethodType } from '@/entities/sales/order';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';

interface UpdateOrderUseCaseRequest {
  orderId: string;
  tenantId: string;
  contactId?: string | null;
  paymentConditionId?: string | null;
  deliveryMethod?: DeliveryMethodType;
  deliveryAddress?: Record<string, unknown>;
  assignedToUserId?: string | null;
  notes?: string;
  internalNotes?: string;
  tags?: string[];
  discountTotal?: number;
  taxTotal?: number;
  shippingTotal?: number;
  expiresAt?: string | null;
}

interface UpdateOrderUseCaseResponse {
  order: Order;
}

export class UpdateOrderUseCase {
  constructor(private ordersRepository: OrdersRepository) {}

  async execute(
    input: UpdateOrderUseCaseRequest,
  ): Promise<UpdateOrderUseCaseResponse> {
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(input.orderId),
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    if (input.contactId !== undefined) {
      order.contactId = input.contactId
        ? new UniqueEntityID(input.contactId)
        : undefined;
    }
    if (input.paymentConditionId !== undefined) {
      order.paymentConditionId = input.paymentConditionId
        ? new UniqueEntityID(input.paymentConditionId)
        : undefined;
    }
    if (input.deliveryMethod !== undefined) {
      order.deliveryMethod = input.deliveryMethod;
    }
    if (input.assignedToUserId !== undefined) {
      order.assignedToUserId = input.assignedToUserId
        ? new UniqueEntityID(input.assignedToUserId)
        : undefined;
    }
    if (input.notes !== undefined) {
      order.notes = input.notes;
    }
    if (input.internalNotes !== undefined) {
      order.internalNotes = input.internalNotes;
    }
    if (input.tags !== undefined) {
      order.tags = input.tags;
    }
    if (input.discountTotal !== undefined) {
      if (input.discountTotal < 0) {
        throw new BadRequestError('Discount cannot be negative.');
      }
      order.discountTotal = input.discountTotal;
    }
    if (input.taxTotal !== undefined) {
      order.taxTotal = input.taxTotal;
    }
    if (input.shippingTotal !== undefined) {
      order.shippingTotal = input.shippingTotal;
    }

    await this.ordersRepository.save(order);

    return { order };
  }
}
