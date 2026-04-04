import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryOrdersRepository } from '@/repositories/sales/in-memory/in-memory-orders-repository';
import { makeOrder } from '@/utils/tests/factories/sales/make-order';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetMyDraftsUseCase } from './get-my-drafts';

let ordersRepository: InMemoryOrdersRepository;
let sut: GetMyDraftsUseCase;

const tenantId = 'tenant-1';
const userId = 'seller-1';

describe('Get My Drafts', () => {
  beforeEach(() => {
    ordersRepository = new InMemoryOrdersRepository();
    sut = new GetMyDraftsUseCase(ordersRepository);
  });

  it('should return DRAFT PDV orders assigned to the user', async () => {
    const myDraft = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      channel: 'PDV',
      assignedToUserId: new UniqueEntityID(userId),
    });

    // Other user's draft
    const otherDraft = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      channel: 'PDV',
      assignedToUserId: new UniqueEntityID('other-user'),
    });

    // My PENDING (not DRAFT)
    const myPending = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'PENDING',
      channel: 'PDV',
      assignedToUserId: new UniqueEntityID(userId),
    });

    // My DRAFT but non-PDV channel
    const myManualDraft = makeOrder({
      tenantId: new UniqueEntityID(tenantId),
      status: 'DRAFT',
      channel: 'MANUAL',
      assignedToUserId: new UniqueEntityID(userId),
    });

    ordersRepository.items.push(myDraft, otherDraft, myPending, myManualDraft);

    const result = await sut.execute({ tenantId, userId });

    expect(result.orders.data).toHaveLength(1);
    expect(result.orders.data[0].id.toString()).toBe(myDraft.id.toString());
  });

  it('should return empty when user has no drafts', async () => {
    const result = await sut.execute({ tenantId, userId });

    expect(result.orders.data).toHaveLength(0);
    expect(result.orders.total).toBe(0);
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 5; i++) {
      ordersRepository.items.push(
        makeOrder({
          tenantId: new UniqueEntityID(tenantId),
          status: 'DRAFT',
          channel: 'PDV',
          assignedToUserId: new UniqueEntityID(userId),
        }),
      );
    }

    const result = await sut.execute({
      tenantId,
      userId,
      page: 1,
      limit: 3,
    });

    expect(result.orders.data).toHaveLength(3);
    expect(result.orders.total).toBe(5);
  });
});
