import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryQuotesRepository } from '@/repositories/sales/in-memory/in-memory-quotes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateQuoteUseCase } from './create-quote';

let quotesRepository: InMemoryQuotesRepository;
let sut: CreateQuoteUseCase;

const validQuoteInput = {
  tenantId: 'tenant-1',
  customerId: 'customer-1',
  title: 'Website Development Quote',
  createdBy: 'user-1',
  items: [
    {
      productName: 'Frontend Development',
      quantity: 1,
      unitPrice: 5000,
    },
    {
      productName: 'Backend Development',
      quantity: 1,
      unitPrice: 8000,
    },
  ],
};

describe('CreateQuoteUseCase', () => {
  beforeEach(() => {
    quotesRepository = new InMemoryQuotesRepository();
    sut = new CreateQuoteUseCase(quotesRepository);
  });

  it('should create a quote with auto-calculated totals', async () => {
    const { quote } = await sut.execute(validQuoteInput);

    expect(quote.title).toBe('Website Development Quote');
    expect(quote.status).toBe('DRAFT');
    expect(quote.subtotal).toBe(13000);
    expect(quote.total).toBe(13000);
    expect(quote.items).toHaveLength(2);
    expect(quotesRepository.quotes).toHaveLength(1);
  });

  it('should apply quote-level discount', async () => {
    const { quote } = await sut.execute({
      ...validQuoteInput,
      discount: 1000,
    });

    expect(quote.subtotal).toBe(13000);
    expect(quote.discount).toBe(1000);
    expect(quote.total).toBe(12000);
  });

  it('should throw if title is empty', async () => {
    await expect(() =>
      sut.execute({ ...validQuoteInput, title: '' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if title exceeds 255 characters', async () => {
    await expect(() =>
      sut.execute({ ...validQuoteInput, title: 'A'.repeat(256) }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if items array is empty', async () => {
    await expect(() =>
      sut.execute({ ...validQuoteInput, items: [] }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if item quantity is zero', async () => {
    await expect(() =>
      sut.execute({
        ...validQuoteInput,
        items: [{ productName: 'Test', quantity: 0, unitPrice: 100 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if item unit price is negative', async () => {
    await expect(() =>
      sut.execute({
        ...validQuoteInput,
        items: [{ productName: 'Test', quantity: 1, unitPrice: -10 }],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
