import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPaymentLinksRepository } from '@/repositories/finance/in-memory/in-memory-payment-links-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPaymentLinkPublicUseCase } from './get-payment-link-public';

let paymentLinksRepository: InMemoryPaymentLinksRepository;
let sut: GetPaymentLinkPublicUseCase;

describe('GetPaymentLinkPublicUseCase', () => {
  beforeEach(() => {
    paymentLinksRepository = new InMemoryPaymentLinksRepository();
    sut = new GetPaymentLinkPublicUseCase(paymentLinksRepository);
  });

  it('should return payment link by slug', async () => {
    await paymentLinksRepository.create({
      tenantId: 'tenant-1',
      slug: 'test-slug-123',
      amount: 250,
      description: 'Pagamento teste',
      customerName: 'Maria',
    });

    const result = await sut.execute({ slug: 'test-slug-123' });

    expect(result.paymentLink.slug).toBe('test-slug-123');
    expect(result.paymentLink.amount).toBe(250);
    expect(result.paymentLink.customerName).toBe('Maria');
  });

  it('should throw when slug not found', async () => {
    await expect(sut.execute({ slug: 'non-existent' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('should mark expired links', async () => {
    const pastDate = new Date('2025-01-01T00:00:00Z');

    await paymentLinksRepository.create({
      tenantId: 'tenant-1',
      slug: 'expired-link',
      amount: 100,
      description: 'Link expirado',
      expiresAt: pastDate,
    });

    const result = await sut.execute({ slug: 'expired-link' });

    expect(result.paymentLink.status).toBe('EXPIRED');
  });
});
