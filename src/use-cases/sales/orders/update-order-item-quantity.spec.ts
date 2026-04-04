import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrderItemsRepository } from '@/repositories/sales/in-memory/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { makeOrderItem } from '@/utils/tests/factories/sales/make-order-item';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateOrderItemQuantityUseCase } from './update-order-item-quantity';

let ordersRepository: InMemoryOrdersRepository;
let orderItemsRepository: InMemoryOrderItemsRepository;
let sut: UpdateOrderItemQuantityUseCase;

const tenantId = 'tenant-1';

describe('Update Order Item Quantity', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    orderItemsRepository = new InMemoryOrderItemsRepository();

    sut = new UpdateOrderItemQuantityUseCase(
      ordersRepository,
      orderItemsRepository,
    );
  });

  it('should update item quantity and recalculate order totals', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      subtotal: 50,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      unitPrice: 25,
      quantity: 2,
    });
    orderItemsRepository.items.push(item);

    const result = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      itemId: item.id.toString(),
      quantity: 5,
    });

    expect(result.orderItem.quantity).toBe(5);
    expect(result.order.subtotal).toBe(125);
  });

  it('should allow cashier to update PENDING order items', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      subtotal: 100,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      unitPrice: 100,
      quantity: 1,
    });
    orderItemsRepository.items.push(item);

    const result = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      itemId: item.id.toString(),
      quantity: 3,
      isCashier: true,
    });

    expect(result.orderItem.quantity).toBe(3);
    expect(result.order.subtotal).toBe(300);
  });

  it('should throw if quantity is zero', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      subtotal: 50,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      unitPrice: 25,
      quantity: 2,
    });
    orderItemsRepository.items.push(item);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        itemId: item.id.toString(),
        quantity: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if quantity is negative', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      subtotal: 50,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      unitPrice: 25,
      quantity: 2,
    });
    orderItemsRepository.items.push(item);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        itemId: item.id.toString(),
        quantity: -1,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if order not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        orderId: 'non-existing',
        itemId: 'some-item',
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if item not found', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      subtotal: 0,
    });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        itemId: 'non-existing',
        quantity: 5,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if item belongs to a different order', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      subtotal: 0,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: new UniqueEntityID(),
      unitPrice: 25,
      quantity: 2,
    });
    orderItemsRepository.items.push(item);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        itemId: item.id.toString(),
        quantity: 5,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject updating CONFIRMED order items', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'CONFIRMED',
      subtotal: 50,
    });
    ordersRepository.items.push(order);

    const item = makeOrderItem({
      tenantId: new UniqueEntityID(tenantId),
      orderId: order.id,
      unitPrice: 25,
      quantity: 2,
    });
    orderItemsRepository.items.push(item);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        itemId: item.id.toString(),
        quantity: 10,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
