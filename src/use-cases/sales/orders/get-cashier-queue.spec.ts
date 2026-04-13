import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { InMemoryPosTerminalsRepository } from '@/repositories/sales/in-memory/in-memory-pos-terminals-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { makePosTerminal } from '@/utils/tests/factories/sales/make-pos-terminal';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetCashierQueueUseCase } from './get-cashier-queue';

let ordersRepository: InMemoryOrdersRepository;
let posTerminalsRepository: InMemoryPosTerminalsRepository;
let sut: GetCashierQueueUseCase;

const tenantId = 'tenant-1';
let terminalId: string;

/**
 * Helper: Order entity doesn't expose `terminalId` but the in-memory
 * repository's `findCashierQueue` reads it via cast. We set it here
 * so the filter works at the unit-test level.
 */
function makeOrderWithTerminal(
  props: Parameters<typeof makeOrder>[0] & { terminalId?: string },
) {
  const order = makeOrder(props);
  if (props?.terminalId) {
    (order as unknown as Record<string, unknown>).terminalId = props.terminalId;
  }
  return order;
}

describe('Get Cashier Queue', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    posTerminalsRepository = new InMemoryPosTerminalsRepository();

    const terminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      mode: 'SALES_WITH_CHECKOUT',
    });
    posTerminalsRepository.items.push(terminal);
    terminalId = terminal.id.toString();

    sut = new GetCashierQueueUseCase(ordersRepository, posTerminalsRepository);
  });

  it('should return PENDING PDV orders for SALES_WITH_CHECKOUT terminal', async () => {
    const olderOrder = makeOrderWithTerminal({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      channel: 'PDV',
      saleCode: 'AAA111',
      terminalId,
      createdAt: new Date('2026-01-01T10:00:00Z'),
    });

    const newerOrder = makeOrderWithTerminal({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      channel: 'PDV',
      saleCode: 'BBB222',
      terminalId,
      createdAt: new Date('2026-01-01T11:00:00Z'),
    });

    // DRAFT should be excluded
    const draftOrder = makeOrderWithTerminal({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      channel: 'PDV',
      terminalId,
    });

    ordersRepository.items.push(olderOrder, newerOrder, draftOrder);

    const result = await sut.execute({ tenantId, terminalId });

    expect(result.orders.data).toHaveLength(2);
    expect(result.orders.total).toBe(2);
  });

  it('should filter by search term on saleCode', async () => {
    const matchingOrder = makeOrderWithTerminal({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      channel: 'PDV',
      saleCode: 'XYZ789',
      terminalId,
    });

    const nonMatchingOrder = makeOrderWithTerminal({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      channel: 'PDV',
      saleCode: 'ABC123',
      terminalId,
    });

    ordersRepository.items.push(matchingOrder, nonMatchingOrder);

    const result = await sut.execute({
      tenantId,
      terminalId,
      search: 'XYZ',
    });

    expect(result.orders.data).toHaveLength(1);
    expect(result.orders.data[0].saleCode).toBe('XYZ789');
  });

  it('should return empty result when no PENDING PDV orders exist', async () => {
    const draftOrder = makeOrderWithTerminal({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      channel: 'PDV',
      terminalId,
    });
    ordersRepository.items.push(draftOrder);

    const result = await sut.execute({ tenantId, terminalId });

    expect(result.orders.data).toHaveLength(0);
    expect(result.orders.total).toBe(0);
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      ordersRepository.items.push(
        makeOrderWithTerminal({
          tenantId: new UniqueEntityID(tenantId),
          status: 'PENDING',
          channel: 'PDV',
          saleCode: `CODE${i}`,
          terminalId,
        }),
      );
    }

    const result = await sut.execute({
      tenantId,
      terminalId,
      page: 1,
      limit: 2,
    });

    expect(result.orders.data).toHaveLength(2);
    expect(result.orders.total).toBe(5);
    expect(result.orders.totalPages).toBe(3);
  });

  it('should reject SALES_ONLY terminal', async () => {
    const salesOnlyTerminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      mode: 'SALES_ONLY',
    });
    posTerminalsRepository.items.push(salesOnlyTerminal);

    await expect(
      sut.execute({
        tenantId,
        terminalId: salesOnlyTerminal.id.toString(),
      }),
    ).rejects.toThrow();
  });

  it('should reject TOTEM terminal', async () => {
    const totemTerminal = makePosTerminal({
      tenantId: new UniqueEntityID(tenantId),
      mode: 'TOTEM',
    });
    posTerminalsRepository.items.push(totemTerminal);

    await expect(
      sut.execute({
        tenantId,
        terminalId: totemTerminal.id.toString(),
      }),
    ).rejects.toThrow();
  });
});
