import { InMemoryPaymentLinksRepository } from '@/repositories/finance/in-memory/in-memory-payment-links-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreatePaymentLinkUseCase } from './create-payment-link';

let paymentLinksRepository: InMemoryPaymentLinksRepository;
let sut: CreatePaymentLinkUseCase;

describe('CreatePaymentLinkUseCase', () => {
  beforeEach(() => {
    paymentLinksRepository = new InMemoryPaymentLinksRepository();
    sut = new CreatePaymentLinkUseCase(paymentLinksRepository);
  });

  it('should create a payment link with slug and url', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      amount: 150.0,
      description: 'Pagamento de consultoria',
    });

    expect(result.paymentLink.slug).toBeTruthy();
    expect(result.paymentLink.slug.length).toBeLessThanOrEqual(12);
    expect(result.paymentLink.amount).toBe(150.0);
    expect(result.paymentLink.description).toBe('Pagamento de consultoria');
    expect(result.paymentLink.status).toBe('ACTIVE');
    expect(result.url).toContain(`/pay/${result.paymentLink.slug}`);
  });

  it('should create a payment link with customer name', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      amount: 200.0,
      description: 'Fatura mensal',
      customerName: 'João Silva',
    });

    expect(result.paymentLink.customerName).toBe('João Silva');
  });

  it('should create a payment link with expiration', async () => {
    const expiresAt = new Date('2026-12-31T23:59:59Z');

    const result = await sut.execute({
      tenantId: 'tenant-1',
      amount: 300.0,
      description: 'Pagamento com prazo',
      expiresAt,
    });

    expect(result.paymentLink.expiresAt).toEqual(expiresAt);
  });

  it('should generate unique slugs', async () => {
    const result1 = await sut.execute({
      tenantId: 'tenant-1',
      amount: 100,
      description: 'Link 1',
    });

    const result2 = await sut.execute({
      tenantId: 'tenant-1',
      amount: 200,
      description: 'Link 2',
    });

    expect(result1.paymentLink.slug).not.toBe(result2.paymentLink.slug);
  });
});
