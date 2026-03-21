import type { MarketplacePaymentDTO } from '@/mappers/sales/marketplace/marketplace-payment-to-dto';
import { marketplacePaymentToDTO } from '@/mappers/sales/marketplace/marketplace-payment-to-dto';
import type { MarketplacePaymentsRepository } from '@/repositories/sales/marketplace-payments-repository';

interface ListMarketplacePaymentsUseCaseRequest {
  tenantId: string;
  connectionId?: string;
  page?: number;
  perPage?: number;
}

interface ListMarketplacePaymentsUseCaseResponse {
  payments: MarketplacePaymentDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListMarketplacePaymentsUseCase {
  constructor(private paymentsRepository: MarketplacePaymentsRepository) {}

  async execute(
    input: ListMarketplacePaymentsUseCaseRequest,
  ): Promise<ListMarketplacePaymentsUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;

    let payments;
    let total;

    if (input.connectionId) {
      [payments, total] = await Promise.all([
        this.paymentsRepository.findManyByConnection(
          input.connectionId,
          page,
          perPage,
          input.tenantId,
        ),
        this.paymentsRepository.countByConnection(
          input.connectionId,
          input.tenantId,
        ),
      ]);
    } else {
      [payments, total] = await Promise.all([
        this.paymentsRepository.findManyByTenant(page, perPage, input.tenantId),
        this.paymentsRepository.countByTenant(input.tenantId),
      ]);
    }

    return {
      payments: payments.map(marketplacePaymentToDTO),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
