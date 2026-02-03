import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { purchaseOrderToDTO } from '@/mappers/stock/purchase-order/purchase-order-to-dto';
import { InMemoryPurchaseOrdersRepository } from '@/repositories/stock/in-memory/in-memory-purchase-orders-repository';
import { makePurchaseOrder } from '@/utils/tests/factories/make-purchase-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPurchaseOrdersUseCase } from './list-purchase-orders';

let purchaseOrdersRepository: InMemoryPurchaseOrdersRepository;
let sut: ListPurchaseOrdersUseCase;

describe('ListPurchaseOrdersUseCase', () => {
  beforeEach(() => {
    purchaseOrdersRepository = new InMemoryPurchaseOrdersRepository();
    sut = new ListPurchaseOrdersUseCase(purchaseOrdersRepository);
  });

  it('should be able to list purchase orders by supplier', async () => {
    const supplierId = new UniqueEntityID();
    const order1 = makePurchaseOrder({ supplierId });
    const order2 = makePurchaseOrder({ supplierId });
    const order3 = makePurchaseOrder();

    purchaseOrdersRepository.items.push(order1, order2, order3);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      supplierId: supplierId.toString(),
    });

    expect(result.purchaseOrders).toHaveLength(2);
    expect(result.purchaseOrders).toEqual([
      purchaseOrderToDTO(order1),
      purchaseOrderToDTO(order2),
    ]);
  });

  it('should be able to list purchase orders by status', async () => {
    const order1 = makePurchaseOrder({ status: 'PENDING' });
    const order2 = makePurchaseOrder({ status: 'PENDING' });
    const order3 = makePurchaseOrder({ status: 'CONFIRMED' });

    purchaseOrdersRepository.items.push(order1, order2, order3);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      status: 'PENDING',
    });

    expect(result.purchaseOrders).toHaveLength(2);
  });

  it('should be able to list all pending purchase orders by default', async () => {
    const order1 = makePurchaseOrder({ status: 'PENDING' });
    const order2 = makePurchaseOrder({ status: 'CONFIRMED' });

    purchaseOrdersRepository.items.push(order1, order2);

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.purchaseOrders).toHaveLength(1);
    expect(result.purchaseOrders[0]).toEqual(purchaseOrderToDTO(order1));
  });
});
