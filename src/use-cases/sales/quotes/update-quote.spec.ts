import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryQuotesRepository } from '@/repositories/sales/in-memory/in-memory-quotes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateQuoteUseCase } from './create-quote';
import { UpdateQuoteUseCase } from './update-quote';

let quotesRepository: InMemoryQuotesRepository;
let createQuoteUseCase: CreateQuoteUseCase;
let sut: UpdateQuoteUseCase;

describe('UpdateQuoteUseCase', () => {
  beforeEach(() => {
    quotesRepository = new InMemoryQuotesRepository();
    createQuoteUseCase = new CreateQuoteUseCase(quotesRepository);
    sut = new UpdateQuoteUseCase(quotesRepository);
  });

  it('should update a DRAFT quote', async () => {
    const { quote: createdQuote } = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Original Title',
      createdBy: 'user-1',
      items: [{ productName: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    const { quote } = await sut.execute({
      tenantId: 'tenant-1',
      id: createdQuote.id,
      title: 'Updated Title',
    });

    expect(quote.title).toBe('Updated Title');
  });

  it('should recalculate totals when items are updated', async () => {
    const { quote: createdQuote } = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Quote',
      createdBy: 'user-1',
      items: [{ productName: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    const { quote } = await sut.execute({
      tenantId: 'tenant-1',
      id: createdQuote.id,
      items: [
        { productName: 'Item B', quantity: 2, unitPrice: 200 },
        { productName: 'Item C', quantity: 3, unitPrice: 50 },
      ],
    });

    expect(quote.subtotal).toBe(550);
    expect(quote.items).toHaveLength(2);
  });

  it('should throw ResourceNotFoundError for non-existent quote', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
        title: 'Test',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if quote is not in DRAFT status', async () => {
    const { quote: createdQuote } = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Quote',
      createdBy: 'user-1',
      items: [{ productName: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    // Change status to SENT
    const quoteEntity = quotesRepository.quotes[0];
    quoteEntity.status = 'SENT';
    quoteEntity.sentAt = new Date();

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: createdQuote.id,
        title: 'Updated',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
