import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrderItemsRepository } from '@/repositories/sales/in-memory/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { makeOrderItem } from '@/utils/tests/factories/sales/make-order-item';
import { beforeEach, describe, expect, it } from 'vitest';
import { SendToCashierUseCase } from './send-to-cashier';

let ordersRepository: InMemoryOrdersRepository;
let orderItemsRepository: InMemoryOrderItemsRepository;
let sut: SendToCashierUseCase;

const tenantId = 'tenant-1';

describe('Send To Cashier', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    orderItemsRepository = new InMemoryOrderItemsRepository();

    sut = new SendToCashierUseCase(ordersRepository, orderItemsRepository);
  });

  it('should transition a DRAFT order with items to PENDING', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      channel: 'PDV',
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
    });

    expect(result.order.status).toBe('PENDING');
    expect(result.order.saleCode).toBeTruthy();
  });

  it('should preserve existing saleCode', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      channel: 'PDV',
      subtotal: 100,
      saleCode: 'ABC123',
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
    });

    expect(result.order.saleCode).toBe('ABC123');
  });

  it('should throw if order not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        orderId: 'non-existing',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if order is not DRAFT', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      subtotal: 100,
    });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if order has no items', async () => {
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
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
