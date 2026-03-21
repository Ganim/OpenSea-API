import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  OrderReturn,
  type RefundMethod,
  type ReturnReason,
  type ReturnType,
} from '@/entities/sales/order-return';
import type { OrderReturnsRepository } from '@/repositories/sales/order-returns-repository';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';

interface CreateReturnUseCaseRequest {
  tenantId: string;
  orderId: string;
  type: ReturnType;
  reason: ReturnReason;
  reasonDetails?: string;
  refundMethod?: RefundMethod;
  refundAmount?: number;
  requestedByUserId: string;
  notes?: string;
}

interface CreateReturnUseCaseResponse {
  orderReturn: OrderReturn;
}

export class CreateReturnUseCase {
  constructor(
    private orderReturnsRepository: OrderReturnsRepository,
    private ordersRepository: OrdersRepository,
  ) {}

  async execute(
    input: CreateReturnUseCaseRequest,
  ): Promise<CreateReturnUseCaseResponse> {
    // Validate order exists
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(input.orderId),
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    const returnNumber =
      await this.orderReturnsRepository.getNextReturnNumber(input.tenantId);

    const orderReturn = OrderReturn.create({
      tenantId: new UniqueEntityID(input.tenantId),
      orderId: new UniqueEntityID(input.orderId),
      returnNumber,
      type: input.type,
      reason: input.reason,
      reasonDetails: input.reasonDetails,
      refundMethod: input.refundMethod,
      refundAmount: input.refundAmount,
      requestedByUserId: new UniqueEntityID(input.requestedByUserId),
      notes: input.notes,
    });

    await this.orderReturnsRepository.create(orderReturn);

    return { orderReturn };
  }
}
