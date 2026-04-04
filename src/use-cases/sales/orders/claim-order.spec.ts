import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { ClaimOrderUseCase } from './claim-order';

let ordersRepository: InMemoryOrdersRepository;
let sut: ClaimOrderUseCase;

const tenantId = 'tenant-1';

describe('Claim Order', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    sut = new ClaimOrderUseCase(ordersRepository);
  });

  it('should claim an unclaimed PENDING order', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      channel: 'PDV',
    });
    ordersRepository.items.push(order);

    const result = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      userId: 'cashier-1',
    });

    expect(result.order.claimedByUserId?.toString()).toBe('cashier-1');
    expect(result.order.claimedAt).toBeTruthy();
  });

  it('should refresh claim when same user re-claims', async () => {
    const oldClaimDate = new Date(Date.now() - 60_000); // 1 minute ago
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      channel: 'PDV',
      claimedByUserId: new UniqueEntityID('cashier-1'),
      claimedAt: oldClaimDate,
    });
    ordersRepository.items.push(order);

    const result = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      userId: 'cashier-1',
    });

    expect(result.order.claimedByUserId?.toString()).toBe('cashier-1');
    expect(result.order.claimedAt!.getTime()).toBeGreaterThan(
      oldClaimDate.getTime(),
    );
  });

  it('should throw ConflictError when another user holds a valid claim', async () => {
    const recentClaim = new Date(Date.now() - 60_000); // 1 minute ago (< 5 min)
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      channel: 'PDV',
      claimedByUserId: new UniqueEntityID('cashier-1'),
      claimedAt: recentClaim,
    });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        userId: 'cashier-2',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('should allow claiming when previous claim has expired', async () => {
    const expiredClaim = new Date(Date.now() - 6 * 60_000); // 6 minutes ago (> 5 min)
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      channel: 'PDV',
      claimedByUserId: new UniqueEntityID('cashier-1'),
      claimedAt: expiredClaim,
    });
    ordersRepository.items.push(order);

    const result = await sut.execute({
      tenantId,
      orderId: order.id.toString(),
      userId: 'cashier-2',
    });

    expect(result.order.claimedByUserId?.toString()).toBe('cashier-2');
  });

  it('should throw if order not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        orderId: 'non-existing',
        userId: 'cashier-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw if order is not PENDING', async () => {
    const order = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      channel: 'PDV',
    });
    ordersRepository.items.push(order);

    await expect(
      sut.execute({
        tenantId,
        orderId: order.id.toString(),
        userId: 'cashier-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
