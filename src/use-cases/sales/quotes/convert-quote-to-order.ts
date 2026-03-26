import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { QuoteDTO } from '@/mappers/sales/quote/quote-to-dto';
import { quoteToDTO } from '@/mappers/sales/quote/quote-to-dto';
import type { QuotesRepository } from '@/repositories/sales/quotes-repository';

interface ConvertQuoteToOrderUseCaseRequest {
  tenantId: string;
  id: string;
}

interface ConvertQuoteToOrderUseCaseResponse {
  quote: QuoteDTO;
}

export class ConvertQuoteToOrderUseCase {
  constructor(private quotesRepository: QuotesRepository) {}

  async execute(
    input: ConvertQuoteToOrderUseCaseRequest,
  ): Promise<ConvertQuoteToOrderUseCaseResponse> {
    const quote = await this.quotesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!quote) {
      throw new ResourceNotFoundError('Quote not found.');
    }

    if (quote.status !== 'SENT' && quote.status !== 'ACCEPTED') {
      throw new BadRequestError(
        'Only quotes in SENT or ACCEPTED status can be converted to an order.',
      );
    }

    if (quote.items.length === 0) {
      throw new BadRequestError(
        'Cannot convert a quote with no items to an order.',
      );
    }

    quote.status = 'ACCEPTED';
    await this.quotesRepository.save(quote);

    return {
      quote: quoteToDTO(quote),
    };
  }
}
