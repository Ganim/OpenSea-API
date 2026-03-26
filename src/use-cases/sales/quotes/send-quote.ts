import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { QuoteDTO } from '@/mappers/sales/quote/quote-to-dto';
import { quoteToDTO } from '@/mappers/sales/quote/quote-to-dto';
import type { QuotesRepository } from '@/repositories/sales/quotes-repository';

interface SendQuoteUseCaseRequest {
  tenantId: string;
  id: string;
}

interface SendQuoteUseCaseResponse {
  quote: QuoteDTO;
}

export class SendQuoteUseCase {
  constructor(private quotesRepository: QuotesRepository) {}

  async execute(
    input: SendQuoteUseCaseRequest,
  ): Promise<SendQuoteUseCaseResponse> {
    const quote = await this.quotesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!quote) {
      throw new ResourceNotFoundError('Quote not found.');
    }

    if (quote.status !== 'DRAFT') {
      throw new BadRequestError('Only quotes in DRAFT status can be sent.');
    }

    quote.status = 'SENT';
    quote.sentAt = new Date();

    await this.quotesRepository.save(quote);

    return {
      quote: quoteToDTO(quote),
    };
  }
}
