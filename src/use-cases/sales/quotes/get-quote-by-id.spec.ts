import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryQuotesRepository } from '@/repositories/sales/in-memory/in-memory-quotes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateQuoteUseCase } from './create-quote';
import { GetQuoteByIdUseCase } from './get-quote-by-id';

let quotesRepository: InMemoryQuotesRepository;
let createQuoteUseCase: CreateQuoteUseCase;
let sut: GetQuoteByIdUseCase;

describe('GetQuoteByIdUseCase', () => {
  beforeEach(() => {
    quotesRepository = new InMemoryQuotesRepository();
    createQuoteUseCase = new CreateQuoteUseCase(quotesRepository);
    sut = new GetQuoteByIdUseCase(quotesRepository);
  });

  it('should return a quote by id', async () => {
    const { quote: createdQuote } = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Test Quote',
      createdBy: 'user-1',
      items: [{ productName: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    const { quote } = await sut.execute({
      tenantId: 'tenant-1',
      id: createdQuote.id,
    });

    expect(quote.title).toBe('Test Quote');
    expect(quote.items).toHaveLength(1);
  });

  it('should throw ResourceNotFoundError for non-existent quote', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
