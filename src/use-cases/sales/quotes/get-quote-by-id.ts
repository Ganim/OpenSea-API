import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { QuoteDTO } from '@/mappers/sales/quote/quote-to-dto';
import { quoteToDTO } from '@/mappers/sales/quote/quote-to-dto';
import type { QuotesRepository } from '@/repositories/sales/quotes-repository';

interface GetQuoteByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetQuoteByIdUseCaseResponse {
  quote: QuoteDTO;
}

export class GetQuoteByIdUseCase {
  constructor(private quotesRepository: QuotesRepository) {}

  async execute(
    input: GetQuoteByIdUseCaseRequest,
  ): Promise<GetQuoteByIdUseCaseResponse> {
    const quote = await this.quotesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!quote) {
      throw new ResourceNotFoundError('Quote not found.');
    }

    return {
      quote: quoteToDTO(quote),
    };
  }
}
