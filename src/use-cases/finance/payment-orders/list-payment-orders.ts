import type { PaymentOrderStatus } from '@prisma/generated/prisma';
import type {
  PaymentOrderRecord,
  PaymentOrdersRepository,
} from '@/repositories/finance/payment-orders-repository';

interface ListPaymentOrdersRequest {
  tenantId: string;
  status?: PaymentOrderStatus;
  page?: number;
  limit?: number;
}

interface ListPaymentOrdersResponse {
  orders: PaymentOrderRecord[];
  total: number;
}

export class ListPaymentOrdersUseCase {
  constructor(private paymentOrdersRepository: PaymentOrdersRepository) {}

  async execute(
    request: ListPaymentOrdersRequest,
  ): Promise<ListPaymentOrdersResponse> {
    const { tenantId, status, page, limit } = request;

    return this.paymentOrdersRepository.findMany(tenantId, {
      status,
      page,
      limit,
    });
  }
}
