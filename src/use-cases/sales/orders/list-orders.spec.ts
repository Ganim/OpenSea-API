import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListOrdersUseCase } from './list-orders';

let ordersRepository: InMemoryOrdersRepository;
let sut: ListOrdersUseCase;

const tenantId = 'tenant-1';

describe('List Orders', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    sut = new ListOrdersUseCase(ordersRepository);
  });

  it('should list orders with pagination', async () => {
    for (let i = 0; i < 25; i++) {
      ordersRepository.items.push(
        makeOrder({ tenantId: new UniqueEntityID(tenantId) }),
      );
    }

    const result = await sut.execute({
      tenantId,
      page: 1,
      limit: 10,
    });

    expect(result.orders).toHaveLength(10);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
  });

  it('should filter orders by type', async () => {
    ordersRepository.items.push(
      makeOrder({ tenantId: new UniqueEntityID(tenantId), type: 'ORDER' }),
      makeOrder({ tenantId: new UniqueEntityID(tenantId), type: 'QUOTE' }),
      makeOrder({ tenantId: new UniqueEntityID(tenantId), type: 'ORDER' }),
    );

    const result = await sut.execute({
      tenantId,
      page: 1,
      limit: 20,
      type: 'QUOTE',
    });

    expect(result.orders).toHaveLength(1);
    expect(result.orders[0].type).toBe('QUOTE');
  });

  it('should filter orders by channel', async () => {
    ordersRepository.items.push(
      makeOrder({ tenantId: new UniqueEntityID(tenantId), channel: 'WEB' }),
      makeOrder({ tenantId: new UniqueEntityID(tenantId), channel: 'PDV' }),
    );

    const result = await sut.execute({
      tenantId,
      page: 1,
      limit: 20,
      channel: 'WEB',
    });

    expect(result.orders).toHaveLength(1);
    expect(result.orders[0].channel).toBe('WEB');
  });

  it('should search orders by order number', async () => {
    ordersRepository.items.push(
      makeOrder({
        tenantId: new UniqueEntityID(tenantId),
        orderNumber: 'ORD-0001',
      }),
      makeOrder({
        tenantId: new UniqueEntityID(tenantId),
        orderNumber: 'ORD-0002',
      }),
    );

    const result = await sut.execute({
      tenantId,
      page: 1,
      limit: 20,
      search: '0001',
    });

    expect(result.orders).toHaveLength(1);
    expect(result.orders[0].orderNumber).toBe('ORD-0001');
  });

  it('should not include deleted orders', async () => {
    const order = makeOrder({ tenantId: new UniqueEntityID(tenantId) });
    order.delete();
    ordersRepository.items.push(order);
    ordersRepository.items.push(
      makeOrder({ tenantId: new UniqueEntityID(tenantId) }),
    );

    const result = await sut.execute({
      tenantId,
      page: 1,
      limit: 20,
    });

    expect(result.orders).toHaveLength(1);
  });

  it('should isolate orders by tenant', async () => {
    ordersRepository.items.push(
      makeOrder({ tenantId: new UniqueEntityID(tenantId) }),
      makeOrder({ tenantId: new UniqueEntityID('other-tenant') }),
    );

    const result = await sut.execute({
      tenantId,
      page: 1,
      limit: 20,
    });

    expect(result.orders).toHaveLength(1);
  });
});
