import { InMemoryPaymentLinksRepository } from '@/repositories/finance/in-memory/in-memory-payment-links-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPaymentLinksUseCase } from './list-payment-links';

let paymentLinksRepository: InMemoryPaymentLinksRepository;
let sut: ListPaymentLinksUseCase;

describe('ListPaymentLinksUseCase', () => {
  beforeEach(() => {
    paymentLinksRepository = new InMemoryPaymentLinksRepository();
    sut = new ListPaymentLinksUseCase(paymentLinksRepository);
  });

  it('should list payment links for a tenant', async () => {
    await paymentLinksRepository.create({
      tenantId: 'tenant-1',
      slug: 'slug-1',
      amount: 100,
      description: 'Link 1',
    });

    await paymentLinksRepository.create({
      tenantId: 'tenant-1',
      slug: 'slug-2',
      amount: 200,
      description: 'Link 2',
    });

    await paymentLinksRepository.create({
      tenantId: 'tenant-2',
      slug: 'slug-3',
      amount: 300,
      description: 'Link de outro tenant',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.paymentLinks).toHaveLength(2);
    expect(result.meta.total).toBe(2);
    expect(result.meta.pages).toBe(1);
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      await paymentLinksRepository.create({
        tenantId: 'tenant-1',
        slug: `slug-${i}`,
        amount: (i + 1) * 100,
        description: `Link ${i + 1}`,
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 2,
    });

    expect(result.paymentLinks).toHaveLength(2);
    expect(result.meta.total).toBe(5);
    expect(result.meta.pages).toBe(3);
  });

  it('should return empty list for tenant with no links', async () => {
    const result = await sut.execute({ tenantId: 'empty-tenant' });

    expect(result.paymentLinks).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });
});
