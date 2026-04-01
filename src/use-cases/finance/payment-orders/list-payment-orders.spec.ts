import { InMemoryPaymentOrdersRepository } from '@/repositories/finance/in-memory/in-memory-payment-orders-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPaymentOrdersUseCase } from './list-payment-orders';

let paymentOrdersRepository: InMemoryPaymentOrdersRepository;
let sut: ListPaymentOrdersUseCase;

describe('ListPaymentOrdersUseCase', () => {
  beforeEach(() => {
    paymentOrdersRepository = new InMemoryPaymentOrdersRepository();
    sut = new ListPaymentOrdersUseCase(paymentOrdersRepository);
  });

  it('should return all payment orders for a tenant', async () => {
    await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: 'entry-1',
      bankAccountId: 'bank-1',
      method: 'PIX',
      amount: 100,
      recipientData: {},
      requestedById: 'user-1',
    });
    await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: 'entry-2',
      bankAccountId: 'bank-1',
      method: 'TED',
      amount: 200,
      recipientData: {},
      requestedById: 'user-1',
    });
    // Different tenant — should not appear
    await paymentOrdersRepository.create({
      tenantId: 'tenant-2',
      entryId: 'entry-3',
      bankAccountId: 'bank-2',
      method: 'PIX',
      amount: 999,
      recipientData: {},
      requestedById: 'user-2',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.total).toBe(2);
    expect(result.orders).toHaveLength(2);
    expect(result.orders.every((o) => o.tenantId === 'tenant-1')).toBe(true);
  });

  it('should filter by status', async () => {
    await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: 'entry-1',
      bankAccountId: 'bank-1',
      method: 'PIX',
      amount: 100,
      recipientData: {},
      requestedById: 'user-1',
    });

    // Approve the second order
    const second = await paymentOrdersRepository.create({
      tenantId: 'tenant-1',
      entryId: 'entry-2',
      bankAccountId: 'bank-1',
      method: 'PIX',
      amount: 200,
      recipientData: {},
      requestedById: 'user-1',
    });
    await paymentOrdersRepository.update({
      id: new UniqueEntityID(second.id),
      tenantId: 'tenant-1',
      status: 'APPROVED',
    });

    const pending = await sut.execute({
      tenantId: 'tenant-1',
      status: 'PENDING_APPROVAL',
    });
    const approved = await sut.execute({
      tenantId: 'tenant-1',
      status: 'APPROVED',
    });

    expect(pending.total).toBe(1);
    expect(approved.total).toBe(1);
    expect(approved.orders[0].status).toBe('APPROVED');
  });

  it('should return empty list for tenant with no orders', async () => {
    const result = await sut.execute({ tenantId: 'empty-tenant' });

    expect(result.total).toBe(0);
    expect(result.orders).toHaveLength(0);
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      await paymentOrdersRepository.create({
        tenantId: 'tenant-1',
        entryId: `entry-${i}`,
        bankAccountId: 'bank-1',
        method: 'PIX',
        amount: 100 * (i + 1),
        recipientData: {},
        requestedById: 'user-1',
      });
    }

    const page1 = await sut.execute({ tenantId: 'tenant-1', page: 1, limit: 3 });
    const page2 = await sut.execute({ tenantId: 'tenant-1', page: 2, limit: 3 });

    expect(page1.total).toBe(5);
    expect(page1.orders).toHaveLength(3);
    expect(page2.orders).toHaveLength(2);
  });
});
