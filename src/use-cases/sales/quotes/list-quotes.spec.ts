import { InMemoryQuotesRepository } from '@/repositories/sales/in-memory/in-memory-quotes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateQuoteUseCase } from './create-quote';
import { ListQuotesUseCase } from './list-quotes';

let quotesRepository: InMemoryQuotesRepository;
let createQuoteUseCase: CreateQuoteUseCase;
let sut: ListQuotesUseCase;

describe('ListQuotesUseCase', () => {
  beforeEach(() => {
    quotesRepository = new InMemoryQuotesRepository();
    createQuoteUseCase = new CreateQuoteUseCase(quotesRepository);
    sut = new ListQuotesUseCase(quotesRepository);
  });

  it('should list quotes with pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await createQuoteUseCase.execute({
        tenantId: 'tenant-1',
        customerId: 'customer-1',
        title: `Quote ${i + 1}`,
        createdBy: 'user-1',
        items: [{ productName: 'Item', quantity: 1, unitPrice: 100 }],
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 3,
    });

    expect(result.quotes).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('should filter by status', async () => {
    await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Draft Quote',
      createdBy: 'user-1',
      items: [{ productName: 'Item', quantity: 1, unitPrice: 100 }],
    });

    const sentQuote = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Sent Quote',
      createdBy: 'user-1',
      items: [{ productName: 'Item', quantity: 1, unitPrice: 200 }],
    });

    quotesRepository.quotes.find(
      (quoteRecord) => quoteRecord.id.toString() === sentQuote.quote.id,
    )!.status = 'SENT';

    const result = await sut.execute({
      tenantId: 'tenant-1',
      status: 'DRAFT',
    });

    expect(result.quotes).toHaveLength(1);
    expect(result.quotes[0].title).toBe('Draft Quote');
  });

  it('should return empty list for different tenant', async () => {
    await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Quote',
      createdBy: 'user-1',
      items: [{ productName: 'Item', quantity: 1, unitPrice: 100 }],
    });

    const result = await sut.execute({ tenantId: 'tenant-2' });
    expect(result.quotes).toHaveLength(0);
  });
});
