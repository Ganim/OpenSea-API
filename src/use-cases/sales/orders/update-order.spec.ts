import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateOrderUseCase } from './update-order';

let ordersRepository: InMemoryOrdersRepository;
let sut: UpdateOrderUseCase;

const tenantId = 'tenant-1';

describe('Update Order', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    sut = new UpdateOrderUseCase(ordersRepository);
  });

  it('should update order notes', async () => {
    const order = makeOrder({ tenantId: new UniqueEntityID(tenantId) });
    ordersRepository.items.push(order);

    const result = await sut.execute({
      orderId: order.id.toString(),
      tenantId,
      notes: 'Updated notes',
    });

    expect(result.order.notes).toBe('Updated notes');
  });

  it('should update order discount total and recalculate', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      subtotal: 1000,
    });
    ordersRepository.items.push(order);

    const result = await sut.execute({
      orderId: order.id.toString(),
      tenantId,
      discountTotal: 200,
    });

    expect(result.order.discountTotal).toBe(200);
    expect(result.order.grandTotal).toBe(800); // 1000 - 200
  });

  it('should not update a non-existing order', async () => {
    await expect(
      sut.execute({
        orderId: 'non-existing',
        tenantId,
        notes: 'test',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should not allow negative discount', async () => {
    const order = makeOrder({ tenantId: new UniqueEntityID(tenantId) });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        orderId: order.id.toString(),
        tenantId,
        discountTotal: -50,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should update tags', async () => {
    const order = makeOrder({ tenantId: new UniqueEntityID(tenantId) });
    ordersRepository.items.push(order);

    const result = await sut.execute({
      orderId: order.id.toString(),
      tenantId,
      tags: ['urgent', 'vip'],
    });

    expect(result.order.tags).toEqual(['urgent', 'vip']);
  });
});
