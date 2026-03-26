import type {
  PaymentLinkRecord,
  PaymentLinksRepository,
} from '@/repositories/finance/payment-links-repository';

interface ListPaymentLinksUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  status?: string;
}

interface ListPaymentLinksUseCaseResponse {
  paymentLinks: PaymentLinkRecord[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListPaymentLinksUseCase {
  constructor(private paymentLinksRepository: PaymentLinksRepository) {}

  async execute(
    request: ListPaymentLinksUseCaseRequest,
  ): Promise<ListPaymentLinksUseCaseResponse> {
    const { tenantId, page = 1, limit = 20, status } = request;

    const { links, total } = await this.paymentLinksRepository.findMany(
      tenantId,
      { page, limit, status },
    );

    return {
      paymentLinks: links,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
