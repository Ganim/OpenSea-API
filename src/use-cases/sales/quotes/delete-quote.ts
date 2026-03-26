import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { QuotesRepository } from '@/repositories/sales/quotes-repository';

interface DeleteQuoteUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteQuoteUseCaseResponse {
  message: string;
}

export class DeleteQuoteUseCase {
  constructor(private quotesRepository: QuotesRepository) {}

  async execute(
    input: DeleteQuoteUseCaseRequest,
  ): Promise<DeleteQuoteUseCaseResponse> {
    const quote = await this.quotesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!quote) {
      throw new ResourceNotFoundError('Quote not found.');
    }

    if (quote.status !== 'DRAFT' && quote.status !== 'REJECTED') {
      throw new BadRequestError(
        'Only quotes in DRAFT or REJECTED status can be deleted.',
      );
    }

    quote.delete();
    await this.quotesRepository.save(quote);

    return {
      message: 'Quote deleted successfully.',
    };
  }
}
