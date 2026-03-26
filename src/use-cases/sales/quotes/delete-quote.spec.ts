import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryQuotesRepository } from '@/repositories/sales/in-memory/in-memory-quotes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateQuoteUseCase } from './create-quote';
import { DeleteQuoteUseCase } from './delete-quote';

let quotesRepository: InMemoryQuotesRepository;
let createQuoteUseCase: CreateQuoteUseCase;
let sut: DeleteQuoteUseCase;

describe('DeleteQuoteUseCase', () => {
  beforeEach(() => {
    quotesRepository = new InMemoryQuotesRepository();
    createQuoteUseCase = new CreateQuoteUseCase(quotesRepository);
    sut = new DeleteQuoteUseCase(quotesRepository);
  });

  it('should soft delete a DRAFT quote', async () => {
    const { quote } = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Quote to Delete',
      createdBy: 'user-1',
      items: [{ productName: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    const result = await sut.execute({ tenantId: 'tenant-1', id: quote.id });

    expect(result.message).toBe('Quote deleted successfully.');
    expect(quotesRepository.quotes[0].isDeleted).toBe(true);
  });

  it('should soft delete a REJECTED quote', async () => {
    const { quote } = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Rejected Quote',
      createdBy: 'user-1',
      items: [{ productName: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    quotesRepository.quotes[0].status = 'REJECTED';

    const result = await sut.execute({ tenantId: 'tenant-1', id: quote.id });
    expect(result.message).toBe('Quote deleted successfully.');
  });

  it('should throw ResourceNotFoundError for non-existent quote', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError if quote is SENT', async () => {
    const { quote } = await createQuoteUseCase.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      title: 'Sent Quote',
      createdBy: 'user-1',
      items: [{ productName: 'Item A', quantity: 1, unitPrice: 100 }],
    });

    quotesRepository.quotes[0].status = 'SENT';

    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', id: quote.id }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
