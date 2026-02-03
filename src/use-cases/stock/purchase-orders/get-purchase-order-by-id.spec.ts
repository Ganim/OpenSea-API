import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { purchaseOrderToDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import { InMemoryPurchaseOrdersRepository } from '@/repositories/stock/in-memory/in-memory-purchase-orders-repository';
import { makePurchaseOrder } from '@/utils/tests/factories/make-purchase-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPurchaseOrderByIdUseCase } from './get-purchase-order-by-id';

let purchaseOrdersRepository: InMemoryPurchaseOrdersRepository;
let sut: GetPurchaseOrderByIdUseCase;

describe('GetPurchaseOrderByIdUseCase', () => {
  beforeEach(() => {
    purchaseOrdersRepository = new InMemoryPurchaseOrdersRepository();
    sut = new GetPurchaseOrderByIdUseCase(purchaseOrdersRepository);
  });

  it('should be able to get a purchase order by id', async () => {
    const order = makePurchaseOrder();
    purchaseOrdersRepository.items.push(order);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: order.id.toString(),
    });

    expect(result.purchaseOrder).toEqual(purchaseOrderToDTO(order));
  });

  it('should not be able to get a nonexistent purchase order', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'nonexistent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
