import type { PaymentCondition } from '@/entities/sales/payment-condition';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type { PaymentConditionsRepository } from '@/repositories/sales/payment-conditions-repository';

interface ListPaymentConditionsUseCaseRequest {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  type?: string;
  isActive?: boolean;
}

interface ListPaymentConditionsUseCaseResponse {
  paymentConditions: PaymentCondition[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListPaymentConditionsUseCase {
  constructor(
    private paymentConditionsRepository: PaymentConditionsRepository,
  ) {}

  async execute(
    request: ListPaymentConditionsUseCaseRequest,
  ): Promise<ListPaymentConditionsUseCaseResponse> {
    const result: PaginatedResult<PaymentCondition> =
      await this.paymentConditionsRepository.findManyPaginated({
        tenantId: request.tenantId,
        page: request.page,
        limit: request.limit,
        search: request.search,
        type: request.type,
        isActive: request.isActive,
      });

    return {
      paymentConditions: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
