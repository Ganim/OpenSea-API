import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrderReturnsRepository } from '@/repositories/sales/in-memory/in-memory-order-returns-repository';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateReturnUseCase } from './create-return';

let orderReturnsRepository: InMemoryOrderReturnsRepository;
let ordersRepository: InMemoryOrdersRepository;
let sut: CreateReturnUseCase;

const tenantId = 'tenant-1';

describe('Create Return', () => {
  beforeEach(() => {
    orderReturnsRepository = new InMemoryOrderReturnsRepository();
    ordersRepository = new InMemoryOrdersRepository();
    sut = new CreateReturnUseCase(orderReturnsRepository, ordersRepository);
  });

  it('should create a return for an existing order', async () => {
    const order = makeOrder({ tenantId: new UniqueEntityID(tenantId) });
    ordersRepository.items.push(order);

    const result = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      type: 'PARTIAL_RETURN',
      reason: 'DEFECTIVE',
      reasonDetails: 'Product arrived damaged',
      refundMethod: 'STORE_CREDIT',
      requestedByUserId: 'user-1',
    });

    expect(result.orderReturn).toBeTruthy();
    expect(result.orderReturn.returnNumber).toMatch(/^RET-/);
    expect(result.orderReturn.type).toBe('PARTIAL_RETURN');
    expect(result.orderReturn.reason).toBe('DEFECTIVE');
    expect(result.orderReturn.status).toBe('REQUESTED');
    expect(orderReturnsRepository.items).toHaveLength(1);
  });

  it('should not create a return for a non-existing order', async () => {
    await expect(
      sut.execute({
        tenantId,
        orderId: 'non-existing',
        type: 'FULL_RETURN',
        reason: 'CHANGED_MIND',
        requestedByUserId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
