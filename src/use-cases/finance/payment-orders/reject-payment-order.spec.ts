import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPaymentOrdersRepository } from '@/repositories/finance/in-memory/in-memory-payment-orders-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RejectPaymentOrderUseCase } from './reject-payment-order';

let paymentOrdersRepository: InMemoryPaymentOrdersRepository;
let sut: RejectPaymentOrderUseCase;

describe('RejectPaymentOrderUseCase', () => {
  beforeEach(() => {
    paymentOrdersRepository = new InMemoryPaymentOrdersRepository();
    sut = new RejectPaymentOrderUseCase(paymentOrdersRepository);
  });

  it('should reject order with reason', async () => {
    const order = await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: 'entry-1',
      bankAccountId: 'bank-1',
      method: 'PIX',
      amount: 500,
      recipientData: { pixKey: 'test@test.com' },
      requestedById: 'user-1',
    });

    const result = await sut.execute({
      orderId: order.id,
      tenantId: 'tenant-1',
      rejectedReason: 'Insufficient documentation for this payment',
    });

    expect(result.order.status).toBe('REJECTED');
    expect(result.order.rejectedReason).toBe(
      'Insufficient documentation for this payment',
    );
  });

  it('should fail if order is not PENDING_APPROVAL', async () => {
    const order = await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: 'entry-1',
      bankAccountId: 'bank-1',
      method: 'PIX',
      amount: 500,
      recipientData: {},
      requestedById: 'user-1',
    });

    // Manually change status
    paymentOrdersRepository.items[0].status = 'COMPLETED';

    await expect(
      sut.execute({
        orderId: order.id,
        tenantId: 'tenant-1',
        rejectedReason: 'Should not work',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail if order not found', async () => {
    await expect(
      sut.execute({
        orderId: 'non-existent',
        tenantId: 'tenant-1',
        rejectedReason: 'No reason',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
