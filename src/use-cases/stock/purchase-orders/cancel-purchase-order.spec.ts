import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryPurchaseOrdersRepository } from '@/repositories/stock/in-memory/in-memory-purchase-orders-repository';
import { makePurchaseOrder } from '@/utils/tests/factories/make-purchase-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelPurchaseOrderUseCase } from './cancel-purchase-order';

let purchaseOrdersRepository: InMemoryPurchaseOrdersRepository;
let sut: CancelPurchaseOrderUseCase;

describe('CancelPurchaseOrderUseCase', () => {
  beforeEach(() => {
    purchaseOrdersRepository = new InMemoryPurchaseOrdersRepository();
    sut = new CancelPurchaseOrderUseCase(purchaseOrdersRepository);
  });

  it('should be able to cancel a purchase order', async () => {
    const order = makePurchaseOrder({ status: 'PENDING' });
    purchaseOrdersRepository.items.push(order);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: order.id.toString(),
    });

    expect(result.purchaseOrder.status).toBe('CANCELLED');
  });

  it('should not be able to cancel a nonexistent purchase order', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'nonexistent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not be able to cancel an already delivered purchase order', async () => {
    const order = makePurchaseOrder({ status: 'DELIVERED' });
    purchaseOrdersRepository.items.push(order);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: order.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
