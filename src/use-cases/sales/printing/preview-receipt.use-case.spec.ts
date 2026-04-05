import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrderItemsRepository } from '@/repositories/sales/in-memory/in-memory-order-items-repository';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { makeOrderItem } from '@/utils/tests/factories/sales/make-order-item';
import { beforeEach, describe, expect, it } from 'vitest';
import { PreviewReceiptUseCase } from './preview-receipt.use-case';

let ordersRepository: InMemoryOrdersRepository;
let orderItemsRepository: InMemoryOrderItemsRepository;
let sut: PreviewReceiptUseCase;

describe('PreviewReceiptUseCase', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    orderItemsRepository = new InMemoryOrderItemsRepository();
    sut = new PreviewReceiptUseCase(ordersRepository, orderItemsRepository);
  });

  it('should generate receipt preview as base64', async () => {
    const order = makeOrder({ tenantId: new UniqueEntityID('tenant-1') });
    await ordersRepository.create(order);

    await orderItemsRepository.create(
      makeOrderItem({
        tenantId: new UniqueEntityID('tenant-1'),
        orderId: order.id,
      }),
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      orderId: order.id.toString(),
    });

    expect(result.format).toBe('escpos');
    expect(result.content.length).toBeGreaterThan(0);
  });

  it('should throw when order does not exist', async () => {
    await expect(() =>
      sut.execute({ tenantId: 'tenant-1', orderId: 'missing' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
