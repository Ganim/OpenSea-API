import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryQuotesRepository } from '@/repositories/sales/in-memory/in-memory-quotes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateQuoteUseCase } from './create-quote';
import { DuplicateQuoteUseCase } from './duplicate-quote';

let quotesRepository: InMemoryQuotesRepository;
let createQuoteUseCase: CreateQuoteUseCase;
let sut: DuplicateQuoteUseCase;

describe('DuplicateQuoteUseCase', () => {
  beforeEach(() => {
    quotesRepository = new InMemoryQuotesRepository();
    createQuoteUseCase = new CreateQuoteUseCase(quotesRepository);
    sut = new DuplicateQuoteUseCase(quotesRepository);
  });

  it('should duplicate a quote as a new DRAFT', async () => {
    const { quote: originalQuote } = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Original Quote',
      createdBy: 'user-1',
      items: [
        { productName: 'Item A', quantity: 2, unitPrice: 100 },
        { productName: 'Item B', quantity: 1, unitPrice: 200 },
      ],
    });

    const { quote: duplicatedQuote } = await sut.execute({
      tenantId: 'tenant-1',
      id: originalQuote.id,
      createdBy: 'user-2',
    });

    expect(duplicatedQuote.id).not.toBe(originalQuote.id);
    expect(duplicatedQuote.title).toBe('Original Quote (copy)');
    expect(duplicatedQuote.status).toBe('DRAFT');
    expect(duplicatedQuote.items).toHaveLength(2);
    expect(duplicatedQuote.subtotal).toBe(originalQuote.subtotal);
    expect(quotesRepository.quotes).toHaveLength(2);
  });

  it('should throw ResourceNotFoundError for non-existent quote', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
        createdBy: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
