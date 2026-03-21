import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteOrderUseCase } from './delete-order';

let ordersRepository: InMemoryOrdersRepository;
let sut: DeleteOrderUseCase;

const tenantId = 'tenant-1';

describe('Delete Order', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    sut = new DeleteOrderUseCase(ordersRepository);
  });

  it('should soft delete an order', async () => {
    const order = makeOrder({ tenantId: new UniqueEntityID(tenantId) });
    ordersRepository.items.push(order);

    await sut.execute({
      orderId: order.id.toString(),
      tenantId,
    });

    expect(ordersRepository.items[0].isDeleted).toBe(true);
  });

  it('should not delete a non-existing order', async () => {
    await expect(
      sut.execute({
        orderId: 'non-existing',
        tenantId,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
