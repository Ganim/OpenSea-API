import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryQuotesRepository } from '@/repositories/sales/in-memory/in-memory-quotes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConvertQuoteToOrderUseCase } from './convert-quote-to-order';
import { CreateQuoteUseCase } from './create-quote';

let quotesRepository: InMemoryQuotesRepository;
let createQuoteUseCase: CreateQuoteUseCase;
let sut: ConvertQuoteToOrderUseCase;

describe('ConvertQuoteToOrderUseCase', () => {
  beforeEach(() => {
    quotesRepository = new InMemoryQuotesRepository();
    createQuoteUseCase = new CreateQuoteUseCase(quotesRepository);
    sut = new ConvertQuoteToOrderUseCase(quotesRepository);
  });

  it('should convert a SENT quote to ACCEPTED', async () => {
    const { quote: createdQuote } = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Quote to Convert',
      createdBy: 'user-1',
      items: [{ productName: 'Item A', quantity: 1, unitPrice: 5000 }],
    });

    quotesRepository.quotes[0].status = 'SENT';

    const { quote } = await sut.execute({
      tenantId: 'tenant-1',
      id: createdQuote.id,
    });

    expect(quote.status).toBe('ACCEPTED');
  });

  it('should throw if quote is in DRAFT status', async () => {
    const { quote: createdQuote } = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Draft Quote',
      createdBy: 'user-1',
      items: [{ productName: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', id: createdQuote.id }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ResourceNotFoundError for non-existent quote', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
