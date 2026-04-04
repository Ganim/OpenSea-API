import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetCashierQueueUseCase } from './get-cashier-queue';

let ordersRepository: InMemoryOrdersRepository;
let sut: GetCashierQueueUseCase;

const tenantId = 'tenant-1';

describe('Get Cashier Queue', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    sut = new GetCashierQueueUseCase(ordersRepository);
  });

  it('should return PENDING PDV orders sorted by creation date', async () => {
    const olderOrder = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      channel: 'PDV',
      saleCode: 'AAA111',
      createdAt: new Date('2026-01-01T10:00:00Z'),
    });

    const newerOrder = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      channel: 'PDV',
      saleCode: 'BBB222',
      createdAt: new Date('2026-01-01T11:00:00Z'),
    });

    // DRAFT should be excluded
    const draftOrder = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      channel: 'PDV',
    });

    ordersRepository.items.push(olderOrder, newerOrder, draftOrder);

    const result = await sut.execute({ tenantId });

    expect(result.orders.data).toHaveLength(2);
    expect(result.orders.total).toBe(2);
  });

  it('should filter by search term on saleCode', async () => {
    const matchingOrder = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      channel: 'PDV',
      saleCode: 'XYZ789',
    });

    const nonMatchingOrder = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      channel: 'PDV',
      saleCode: 'ABC123',
    });

    ordersRepository.items.push(matchingOrder, nonMatchingOrder);

    const result = await sut.execute({
      tenantId,
      search: 'XYZ',
    });

    expect(result.orders.data).toHaveLength(1);
    expect(result.orders.data[0].saleCode).toBe('XYZ789');
  });

  it('should return empty result when no PENDING PDV orders exist', async () => {
    const draftOrder = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      channel: 'PDV',
    });
    ordersRepository.items.push(draftOrder);

    const result = await sut.execute({ tenantId });

    expect(result.orders.data).toHaveLength(0);
    expect(result.orders.total).toBe(0);
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      ordersRepository.items.push(
        makeOrder({
          tenantId: new UniqueEntityID(tenantId),
          status: 'PENDING',
          channel: 'PDV',
          saleCode: `CODE${i}`,
        }),
      );
    }

    const result = await sut.execute({
      tenantId,
      page: 1,
      limit: 2,
    });

    expect(result.orders.data).toHaveLength(2);
    expect(result.orders.total).toBe(5);
    expect(result.orders.totalPages).toBe(3);
  });
});
