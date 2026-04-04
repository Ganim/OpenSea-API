import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrderItemsRepository } from '@/repositories/sales/in-memory/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { makeOrderItem } from '@/utils/tests/factories/sales/make-order-item';
import { beforeEach, describe, expect, it } from 'vitest';
import { RemoveOrderItemUseCase } from './remove-order-item';

let ordersRepository: InMemoryOrdersRepository;
let orderItemsRepository: InMemoryOrderItemsRepository;
let sut: RemoveOrderItemUseCase;

const tenantId = 'tenant-1';

describe('Remove Order Item', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    orderItemsRepository = new InMemoryOrderItemsRepository();

    sut = new RemoveOrderItemUseCase(ordersRepository, orderItemsRepository);
  });

  it('should remove an item from a DRAFT order and recalculate totals', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      subtotal: 100,
    });
    ordersRepository.items.push(order);

    const item1 = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      unitPrice: 60,
      quantity: 1,
    });
    const item2 = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      unitPrice: 40,
      quantity: 1,
    });
    orderItemsRepository.items.push(item1, item2);

    const result = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      itemId: item1.id.toString(),
    });

    expect(orderItemsRepository.items).toHaveLength(1);
    expect(result.order.subtotal).toBe(40);
  });

  it('should allow cashier to remove items from PENDING order', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      subtotal: 50,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      unitPrice: 50,
      quantity: 1,
    });
    orderItemsRepository.items.push(item);

    const result = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      itemId: item.id.toString(),
      isCashier: true,
    });

    expect(orderItemsRepository.items).toHaveLength(0);
    expect(result.order.subtotal).toBe(0);
  });

  it('should throw if order not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        orderId: 'non-existing',
        itemId: 'some-item',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if order is CONFIRMED', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'CONFIRMED',
      subtotal: 100,
    });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        itemId: 'some-item',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if item not found', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      subtotal: 100,
    });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        itemId: 'non-existing',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if item does not belong to the order', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      subtotal: 100,
    });
    ordersRepository.items.push(order);

    const otherOrderId = new UniqueEntityID();
    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: otherOrderId,
      unitPrice: 100,
      quantity: 1,
    });
    orderItemsRepository.items.push(item);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        itemId: item.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject removing from PENDING order without cashier flag', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      subtotal: 50,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      unitPrice: 50,
      quantity: 1,
    });
    orderItemsRepository.items.push(item);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        itemId: item.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
