import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPaymentOrdersRepository } from '@/repositories/finance/in-memory/in-memory-payment-orders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPaymentOrderUseCase } from './get-payment-order';

let paymentOrdersRepository: InMemoryPaymentOrdersRepository;
let sut: GetPaymentOrderUseCase;

describe('GetPaymentOrderUseCase', () => {
  beforeEach(() => {
    paymentOrdersRepository = new InMemoryPaymentOrdersRepository();
    sut = new GetPaymentOrderUseCase(paymentOrdersRepository);
  });

  it('should return a payment order by id', async () => {
    const created = await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: 'entry-1',
      bankAccountId: 'bank-1',
      method: 'PIX',
      amount: 350,
      recipientData: { name: 'Fornecedor', pixKey: 'chave@pix.com' },
      requestedById: 'user-1',
    });

    const result = await sut.execute({
      orderId: created.id,
      tenantId: 'tenant-1',
    });

    expect(result.order.id).toBe(created.id);
    expect(result.order.amount).toBe(350);
    expect(result.order.method).toBe('PIX');
    expect(result.order.status).toBe('PENDING_APPROVAL');
  });

  it('should throw ResourceNotFoundError for non-existent order', async () => {
    await expect(
      sut.execute({
        orderId: 'non-existent-id',
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError for order from a different tenant', async () => {
    const created = await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: 'entry-1',
      bankAccountId: 'bank-1',
      method: 'TED',
      amount: 100,
      recipientData: {},
      requestedById: 'user-1',
    });

    await expect(
      sut.execute({
        orderId: created.id,
        tenantId: 'tenant-2', // different tenant
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
