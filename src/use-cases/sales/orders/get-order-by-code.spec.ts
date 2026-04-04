import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrderItemsRepository } from '@/repositories/sales/in-memory/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { makeOrderItem } from '@/utils/tests/factories/sales/make-order-item';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetOrderByCodeUseCase } from './get-order-by-code';

let ordersRepository: InMemoryOrdersRepository;
let orderItemsRepository: InMemoryOrderItemsRepository;
let sut: GetOrderByCodeUseCase;

const tenantId = 'tenant-1';

describe('Get Order By Code', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    orderItemsRepository = new InMemoryOrderItemsRepository();

    sut = new GetOrderByCodeUseCase(ordersRepository, orderItemsRepository);
  });

  it('should find an order by sale code with its items', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      channel: 'PDV',
      saleCode: 'XYZ789',
    });
    ordersRepository.items.push(order);

    const item1 = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      name: 'Camiseta P',
      unitPrice: 49.9,
      quantity: 2,
    });
    const item2 = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      name: 'Bermuda M',
      unitPrice: 89.9,
      quantity: 1,
    });
    orderItemsRepository.items.push(item1, item2);

    const result = await sut.execute({
      tenantId,
      saleCode: 'XYZ789',
    });

    expect(result.order.saleCode).toBe('XYZ789');
    expect(result.items).toHaveLength(2);
  });

  it('should throw if sale code not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        saleCode: 'NONEXIST',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not find orders from other tenants', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID('other-tenant'),
      status: 'PENDING',
      channel: 'PDV',
      saleCode: 'ABC123',
    });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        tenantId,
        saleCode: 'ABC123',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
