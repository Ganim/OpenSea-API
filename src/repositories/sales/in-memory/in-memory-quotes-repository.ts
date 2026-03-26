import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Quote } from '@/entities/sales/quote';
import type { QuoteStatus } from '@/entities/sales/quote';
import type { CreateQuoteSchema, QuotesRepository } from '../quotes-repository';

export class InMemoryQuotesRepository implements QuotesRepository {
  public quotes: Quote[] = [];

  async create(data: CreateQuoteSchema): Promise<Quote> {
    const quoteId = new UniqueEntityID();

    const quoteItems = data.items.map((quoteItem) => ({
      id: new UniqueEntityID(),
      quoteId,
      variantId: quoteItem.variantId,
      productName: quoteItem.productName,
      quantity: quoteItem.quantity,
      unitPrice: quoteItem.unitPrice,
      discount: quoteItem.discount ?? 0,
      total: quoteItem.total,
      createdAt: new Date(),
    }));

    const quote = Quote.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        customerId: new UniqueEntityID(data.customerId),
        title: data.title,
        validUntil: data.validUntil,
        notes: data.notes,
        subtotal: data.subtotal,
        discount: data.discount,
        total: data.total,
        createdBy: data.createdBy,
        items: quoteItems,
      },
      quoteId,
    );

    this.quotes.push(quote);
    return quote;
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Quote | null> {
    const quote = this.quotes.find(
      (quoteRecord) =>
        quoteRecord.id.toString() === id.toString() &&
        quoteRecord.tenantId.toString() === tenantId &&
        !quoteRecord.deletedAt,
    );

    return quote ?? null;
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: { status?: QuoteStatus; customerId?: string },
  ): Promise<Quote[]> {
    let filteredQuotes = this.quotes.filter(
      (quoteRecord) =>
        quoteRecord.tenantId.toString() === tenantId && !quoteRecord.deletedAt,
    );

    if (filters?.status) {
      filteredQuotes = filteredQuotes.filter(
        (quoteRecord) => quoteRecord.status === filters.status,
      );
    }

    if (filters?.customerId) {
      filteredQuotes = filteredQuotes.filter(
        (quoteRecord) =>
          quoteRecord.customerId.toString() === filters.customerId,
      );
    }

    const start = (page - 1) * perPage;
    return filteredQuotes
      .sort(
        (quoteA, quoteB) =>
          quoteB.createdAt.getTime() - quoteA.createdAt.getTime(),
      )
      .slice(start, start + perPage);
  }

  async countMany(
    tenantId: string,
    filters?: { status?: QuoteStatus; customerId?: string },
  ): Promise<number> {
    let filteredQuotes = this.quotes.filter(
      (quoteRecord) =>
        quoteRecord.tenantId.toString() === tenantId && !quoteRecord.deletedAt,
    );

    if (filters?.status) {
      filteredQuotes = filteredQuotes.filter(
        (quoteRecord) => quoteRecord.status === filters.status,
      );
    }

    if (filters?.customerId) {
      filteredQuotes = filteredQuotes.filter(
        (quoteRecord) =>
          quoteRecord.customerId.toString() === filters.customerId,
      );
    }

    return filteredQuotes.length;
  }

  async save(quote: Quote): Promise<void> {
    const quoteIndex = this.quotes.findIndex(
      (quoteRecord) => quoteRecord.id.toString() === quote.id.toString(),
    );

    if (quoteIndex >= 0) {
      this.quotes[quoteIndex] = quote;
    }
  }

  async updateViewTracking(id: string): Promise<boolean> {
    const quote = this.quotes.find(
      (quoteRecord) =>
        quoteRecord.id.toString() === id && !quoteRecord.deletedAt,
    );

    if (!quote) return false;

    const now = new Date();

    if (!quote.viewedAt) {
      quote.viewedAt = now;
    }

    quote.viewCount = quote.viewCount + 1;
    quote.lastViewedAt = now;

    return true;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const quote = this.quotes.find(
      (quoteRecord) =>
        quoteRecord.id.toString() === id.toString() &&
        quoteRecord.tenantId.toString() === tenantId,
    );

    if (quote) {
      quote.delete();
    }
  }
}
