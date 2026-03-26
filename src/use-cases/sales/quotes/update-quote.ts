import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { QuoteDTO } from '@/mappers/sales/quote/quote-to-dto';
import { quoteToDTO } from '@/mappers/sales/quote/quote-to-dto';
import type { QuotesRepository } from '@/repositories/sales/quotes-repository';

interface UpdateQuoteItemInput {
  variantId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

interface UpdateQuoteUseCaseRequest {
  tenantId: string;
  id: string;
  customerId?: string;
  title?: string;
  validUntil?: Date | null;
  notes?: string | null;
  discount?: number;
  items?: UpdateQuoteItemInput[];
}

interface UpdateQuoteUseCaseResponse {
  quote: QuoteDTO;
}

export class UpdateQuoteUseCase {
  constructor(private quotesRepository: QuotesRepository) {}

  async execute(
    input: UpdateQuoteUseCaseRequest,
  ): Promise<UpdateQuoteUseCaseResponse> {
    const quote = await this.quotesRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!quote) {
      throw new ResourceNotFoundError('Quote not found.');
    }

    if (quote.status !== 'DRAFT') {
      throw new BadRequestError('Only quotes in DRAFT status can be updated.');
    }

    if (input.title !== undefined) {
      if (input.title.trim().length === 0) {
        throw new BadRequestError('Quote title is required.');
      }
      if (input.title.length > 255) {
        throw new BadRequestError('Quote title cannot exceed 255 characters.');
      }
      quote.title = input.title.trim();
    }

    if (input.customerId !== undefined) {
      quote.customerId = new UniqueEntityID(input.customerId);
    }

    if (input.validUntil !== undefined) {
      quote.validUntil = input.validUntil ?? undefined;
    }

    if (input.notes !== undefined) {
      quote.notes = input.notes ?? undefined;
    }

    if (input.items !== undefined) {
      if (input.items.length === 0) {
        throw new BadRequestError('Quote must have at least one item.');
      }

      const calculatedItems = input.items.map((quoteItem) => {
        if (quoteItem.quantity <= 0) {
          throw new BadRequestError('Item quantity must be greater than zero.');
        }
        if (quoteItem.unitPrice < 0) {
          throw new BadRequestError('Item unit price cannot be negative.');
        }

        const itemDiscount = quoteItem.discount ?? 0;
        const itemTotal =
          quoteItem.quantity * quoteItem.unitPrice - itemDiscount;

        return {
          id: new UniqueEntityID(),
          quoteId: quote.id,
          variantId: quoteItem.variantId,
          productName: quoteItem.productName,
          quantity: quoteItem.quantity,
          unitPrice: quoteItem.unitPrice,
          discount: itemDiscount,
          total: Math.max(0, itemTotal),
          createdAt: new Date(),
        };
      });

      quote.items = calculatedItems;

      const subtotal = calculatedItems.reduce(
        (sum, quoteItem) => sum + quoteItem.quantity * quoteItem.unitPrice,
        0,
      );
      quote.subtotal = subtotal;
    }

    if (input.discount !== undefined) {
      quote.discount = input.discount;
    }

    quote.total = Math.max(0, quote.subtotal - quote.discount);

    await this.quotesRepository.save(quote);

    return {
      quote: quoteToDTO(quote),
    };
  }
}
