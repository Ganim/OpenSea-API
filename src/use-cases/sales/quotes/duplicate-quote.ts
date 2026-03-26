import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { QuoteDTO } from '@/mappers/sales/quote/quote-to-dto';
import { quoteToDTO } from '@/mappers/sales/quote/quote-to-dto';
import type { QuotesRepository } from '@/repositories/sales/quotes-repository';

interface DuplicateQuoteUseCaseRequest {
  tenantId: string;
  id: string;
  createdBy: string;
}

interface DuplicateQuoteUseCaseResponse {
  quote: QuoteDTO;
}

export class DuplicateQuoteUseCase {
  constructor(private quotesRepository: QuotesRepository) {}

  async execute(
    input: DuplicateQuoteUseCaseRequest,
  ): Promise<DuplicateQuoteUseCaseResponse> {
    const originalQuote = await this.quotesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!originalQuote) {
      throw new ResourceNotFoundError('Quote not found.');
    }

    const duplicatedQuote = await this.quotesRepository.create({
      tenantId: input.tenantId,
      customerId: originalQuote.customerId.toString(),
      title: `${originalQuote.title} (copy)`,
      validUntil: originalQuote.validUntil,
      notes: originalQuote.notes,
      subtotal: originalQuote.subtotal,
      discount: originalQuote.discount,
      total: originalQuote.total,
      createdBy: input.createdBy,
      items: originalQuote.items.map((quoteItem) => ({
        variantId: quoteItem.variantId,
        productName: quoteItem.productName,
        quantity: quoteItem.quantity,
        unitPrice: quoteItem.unitPrice,
        discount: quoteItem.discount,
        total: quoteItem.total,
      })),
    });

    return {
      quote: quoteToDTO(duplicatedQuote),
    };
  }
}
