import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  PaymentOrderRecord,
  PaymentOrdersRepository,
} from '@/repositories/finance/payment-orders-repository';

interface RejectPaymentOrderRequest {
  orderId: string;
  tenantId: string;
  rejectedReason: string;
}

interface RejectPaymentOrderResponse {
  order: PaymentOrderRecord;
}

export class RejectPaymentOrderUseCase {
  constructor(private paymentOrdersRepository: PaymentOrdersRepository) {}

  async execute(
    request: RejectPaymentOrderRequest,
  ): Promise<RejectPaymentOrderResponse> {
    const { orderId, tenantId, rejectedReason } = request;

    const order = await this.paymentOrdersRepository.findById(
      new UniqueEntityID(orderId),
      tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Payment order not found');
    }

    if (order.status !== 'PENDING_APPROVAL') {
      throw new BadRequestError(
        'Only orders with PENDING_APPROVAL status can be rejected',
      );
    }

    const updatedOrder = await this.paymentOrdersRepository.update({
      id: new UniqueEntityID(orderId),
      tenantId,
      status: 'REJECTED',
      rejectedReason,
    });

    return { order: updatedOrder! };
  }
}
