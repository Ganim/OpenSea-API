import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrderItemsRepository } from '@/repositories/sales/in-memory/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { makeOrderItem } from '@/utils/tests/factories/sales/make-order-item';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetOrderByIdUseCase } from './get-order-by-id';

let ordersRepository: InMemoryOrdersRepository;
let orderItemsRepository: InMemoryOrderItemsRepository;
let sut: GetOrderByIdUseCase;

const tenantId = 'tenant-1';

describe('Get Order By Id', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    orderItemsRepository = new InMemoryOrderItemsRepository();
    sut = new GetOrderByIdUseCase(ordersRepository, orderItemsRepository);
  });

  it('should get an order by id with items', async () => {
    const order = makeOrder({ tenantId: new UniqueEntityID(tenantId) });
    ordersRepository.items.push(order);

    const item1 = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
    });
    const item2 = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
    });
    orderItemsRepository.items.push(item1, item2);

    const result = await sut.execute({
      orderId: order.id.toString(),
      tenantId,
    });

    expect(result.order.id.toString()).toBe(order.id.toString());
    expect(result.items).toHaveLength(2);
  });

  it('should not get a non-existing order', async () => {
    await expect(
      sut.execute({
        orderId: 'non-existing',
        tenantId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not get a deleted order', async () => {
    const order = makeOrder({ tenantId: new UniqueEntityID(tenantId) });
    order.delete();
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        orderId: order.id.toString(),
        tenantId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
