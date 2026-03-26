import type { QuoteStatus } from '@/entities/sales/quote';
import type { QuoteDTO } from '@/mappers/sales/quote/quote-to-dto';
import { quoteToDTO } from '@/mappers/sales/quote/quote-to-dto';
import type { QuotesRepository } from '@/repositories/sales/quotes-repository';

interface ListQuotesUseCaseRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  status?: QuoteStatus;
  customerId?: string;
}

interface ListQuotesUseCaseResponse {
  quotes: QuoteDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListQuotesUseCase {
  constructor(private quotesRepository: QuotesRepository) {}

  async execute(
    input: ListQuotesUseCaseRequest,
  ): Promise<ListQuotesUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const filters = {
      status: input.status,
      customerId: input.customerId,
    };

    const [quotes, total] = await Promise.all([
      this.quotesRepository.findMany(page, perPage, input.tenantId, filters),
      this.quotesRepository.countMany(input.tenantId, filters),
    ]);

    return {
      quotes: quotes.map(quoteToDTO),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
