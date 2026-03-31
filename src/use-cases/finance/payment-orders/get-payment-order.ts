import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  PaymentOrderRecord,
  PaymentOrdersRepository,
} from '@/repositories/finance/payment-orders-repository';

interface GetPaymentOrderRequest {
  orderId: string;
  tenantId: string;
}

interface GetPaymentOrderResponse {
  order: PaymentOrderRecord;
}

export class GetPaymentOrderUseCase {
  constructor(private paymentOrdersRepository: PaymentOrdersRepository) {}

  async execute(
    request: GetPaymentOrderRequest,
  ): Promise<GetPaymentOrderResponse> {
    const { orderId, tenantId } = request;

    const order = await this.paymentOrdersRepository.findById(
      new UniqueEntityID(orderId),
      tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Payment order not found');
    }

    return { order };
  }
}
