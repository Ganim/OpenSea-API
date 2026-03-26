import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryQuotesRepository } from '@/repositories/sales/in-memory/in-memory-quotes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateQuoteUseCase } from './create-quote';
import { SendQuoteUseCase } from './send-quote';

let quotesRepository: InMemoryQuotesRepository;
let createQuoteUseCase: CreateQuoteUseCase;
let sut: SendQuoteUseCase;

describe('SendQuoteUseCase', () => {
  beforeEach(() => {
    quotesRepository = new InMemoryQuotesRepository();
    createQuoteUseCase = new CreateQuoteUseCase(quotesRepository);
    sut = new SendQuoteUseCase(quotesRepository);
  });

  it('should send a DRAFT quote', async () => {
    const { quote: createdQuote } = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Quote to Send',
      createdBy: 'user-1',
      items: [{ productName: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    const { quote } = await sut.execute({
      tenantId: 'tenant-1',
      id: createdQuote.id,
    });

    expect(quote.status).toBe('SENT');
    expect(quote.sentAt).toBeDefined();
  });

  it('should throw if quote is not DRAFT', async () => {
    const { quote: createdQuote } = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Already Sent',
      createdBy: 'user-1',
      items: [{ productName: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    quotesRepository.quotes[0].status = 'SENT';

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
