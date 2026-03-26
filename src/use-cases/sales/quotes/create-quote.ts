import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { QuoteDTO } from '@/mappers/sales/quote/quote-to-dto';
import { quoteToDTO } from '@/mappers/sales/quote/quote-to-dto';
import type { QuotesRepository } from '@/repositories/sales/quotes-repository';

interface CreateQuoteItemInput {
  variantId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

interface CreateQuoteUseCaseRequest {
  tenantId: string;
  customerId: string;
  title: string;
  validUntil?: Date;
  notes?: string;
  discount?: number;
  createdBy: string;
  items: CreateQuoteItemInput[];
}

interface CreateQuoteUseCaseResponse {
  quote: QuoteDTO;
}

export class CreateQuoteUseCase {
  constructor(private quotesRepository: QuotesRepository) {}

  async execute(
    input: CreateQuoteUseCaseRequest,
  ): Promise<CreateQuoteUseCaseResponse> {
    if (!input.title || input.title.trim().length === 0) {
      throw new BadRequestError('Quote title is required.');
    }

    if (input.title.length > 255) {
      throw new BadRequestError('Quote title cannot exceed 255 characters.');
    }

    if (!input.items || input.items.length === 0) {
      throw new BadRequestError('Quote must have at least one item.');
    }

    // Calculate item totals and subtotal
    const calculatedItems = input.items.map((quoteItem) => {
      if (quoteItem.quantity <= 0) {
        throw new BadRequestError('Item quantity must be greater than zero.');
      }
      if (quoteItem.unitPrice < 0) {
        throw new BadRequestError('Item unit price cannot be negative.');
      }

      const itemDiscount = quoteItem.discount ?? 0;
      const itemTotal = quoteItem.quantity * quoteItem.unitPrice - itemDiscount;

      return {
        variantId: quoteItem.variantId,
        productName: quoteItem.productName,
        quantity: quoteItem.quantity,
        unitPrice: quoteItem.unitPrice,
        discount: itemDiscount,
        total: Math.max(0, itemTotal),
      };
    });

    const subtotal = calculatedItems.reduce(
      (sum, quoteItem) => sum + quoteItem.quantity * quoteItem.unitPrice,
      0,
    );
    const quoteDiscount = input.discount ?? 0;
    const total = Math.max(0, subtotal - quoteDiscount);

    const quote = await this.quotesRepository.create({
      tenantId: input.tenantId,
      customerId: input.customerId,
      title: input.title.trim(),
      validUntil: input.validUntil,
      notes: input.notes,
      subtotal,
      discount: quoteDiscount,
      total,
      createdBy: input.createdBy,
      items: calculatedItems,
    });

    return {
      quote: quoteToDTO(quote),
    };
  }
}
