import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeKudos } from '@/entities/hr/employee-kudos';
import { KudosReaction } from '@/entities/hr/kudos-reaction';
import { KudosReply } from '@/entities/hr/kudos-reply';
import { InMemoryEmployeeKudosRepository } from '@/repositories/hr/in-memory/in-memory-employee-kudos-repository';
import { InMemoryKudosReactionsRepository } from '@/repositories/hr/in-memory/in-memory-kudos-reactions-repository';
import { InMemoryKudosRepliesRepository } from '@/repositories/hr/in-memory/in-memory-kudos-replies-repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { ListKudosFeedUseCase } from './list-kudos-feed';

let employeeKudosRepository: InMemoryEmployeeKudosRepository;
let kudosReactionsRepository: InMemoryKudosReactionsRepository;
let kudosRepliesRepository: InMemoryKudosRepliesRepository;
let listKudosFeedUseCase: ListKudosFeedUseCase;

const TENANT_ID = new UniqueEntityID().toString();

function createTestKudos(
  overrides: {
    tenantId?: string;
    isPublic?: boolean;
    isPinned?: boolean;
    pinnedAt?: Date | null;
    pinnedBy?: UniqueEntityID | null;
    fromEmployeeId?: string;
    toEmployeeId?: string;
  } = {},
) {
  return EmployeeKudos.create({
    tenantId: new UniqueEntityID(overrides.tenantId ?? TENANT_ID),
    fromEmployeeId: new UniqueEntityID(
      overrides.fromEmployeeId ?? new UniqueEntityID().toString(),
    ),
    toEmployeeId: new UniqueEntityID(
      overrides.toEmployeeId ?? new UniqueEntityID().toString(),
    ),
    message: 'Amazing innovation on the new feature!',
    category: 'INNOVATION',
    isPublic: overrides.isPublic ?? true,
    isPinned: overrides.isPinned ?? false,
    pinnedAt: overrides.pinnedAt ?? null,
    pinnedBy: overrides.pinnedBy ?? null,
  });
}

describe('ListKudosFeedUseCase', () => {
  beforeEach(() => {
    employeeKudosRepository = new InMemoryEmployeeKudosRepository();
    kudosReactionsRepository = new InMemoryKudosReactionsRepository();
    kudosRepliesRepository = new InMemoryKudosRepliesRepository();
    listKudosFeedUseCase = new ListKudosFeedUseCase(
      employeeKudosRepository,
      kudosReactionsRepository,
      kudosRepliesRepository,
    );
  });

  it('should list public kudos for the tenant feed', async () => {
    await employeeKudosRepository.create(createTestKudos());

    const { items, total } = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(items).toHaveLength(1);
    expect(total).toBe(1);
    expect(items[0].reactionsSummary).toEqual([]);
    expect(items[0].repliesCount).toBe(0);
  });

  it('should return empty list when no public kudos exist', async () => {
    const { items, total } = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(items).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('should exclude private kudos from the feed', async () => {
    await employeeKudosRepository.create(createTestKudos({ isPublic: true }));
    await employeeKudosRepository.create(createTestKudos({ isPublic: false }));

    const { items, total } = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(items).toHaveLength(1);
    expect(total).toBe(1);
    expect(items[0].kudos.isPublic).toBe(true);
  });

  it('should only return kudos for the specified tenant', async () => {
    const differentTenantId = new UniqueEntityID().toString();

    await employeeKudosRepository.create(createTestKudos());
    await employeeKudosRepository.create(
      createTestKudos({ tenantId: differentTenantId }),
    );

    const { items, total } = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(items).toHaveLength(1);
    expect(total).toBe(1);
  });

  it('should paginate results correctly', async () => {
    for (let i = 0; i < 5; i++) {
      await employeeKudosRepository.create(createTestKudos());
    }

    const firstPage = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 2,
    });

    expect(firstPage.items).toHaveLength(2);
    expect(firstPage.total).toBe(5);

    const secondPage = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 2,
      limit: 2,
    });

    expect(secondPage.items).toHaveLength(2);
    expect(secondPage.total).toBe(5);

    const thirdPage = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 3,
      limit: 2,
    });

    expect(thirdPage.items).toHaveLength(1);
    expect(thirdPage.total).toBe(5);
  });

  it('should sort pinned kudos before non-pinned', async () => {
    const olderUnpinned = createTestKudos();
    await employeeKudosRepository.create(olderUnpinned);

    await new Promise((resolve) => setTimeout(resolve, 5));

    const newerUnpinned = createTestKudos();
    await employeeKudosRepository.create(newerUnpinned);

    await new Promise((resolve) => setTimeout(resolve, 5));

    const pinned = createTestKudos();
    pinned.pin(new UniqueEntityID());
    await employeeKudosRepository.create(pinned);

    const { items } = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(items[0].kudos.isPinned).toBe(true);
    expect(items[0].kudos.id.equals(pinned.id)).toBe(true);
  });

  it('should filter by pinned=true to return only pinned kudos', async () => {
    await employeeKudosRepository.create(createTestKudos());

    const pinned = createTestKudos();
    pinned.pin(new UniqueEntityID());
    await employeeKudosRepository.create(pinned);

    const { items, total } = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      pinned: true,
    });

    expect(items).toHaveLength(1);
    expect(total).toBe(1);
    expect(items[0].kudos.isPinned).toBe(true);
  });

  it('should include reactions summary and replies count', async () => {
    const kudos = createTestKudos();
    await employeeKudosRepository.create(kudos);

    await kudosReactionsRepository.create(
      KudosReaction.create({
        tenantId: kudos.tenantId,
        kudosId: kudos.id,
        employeeId: new UniqueEntityID(),
        emoji: '👍',
      }),
    );
    await kudosReactionsRepository.create(
      KudosReaction.create({
        tenantId: kudos.tenantId,
        kudosId: kudos.id,
        employeeId: new UniqueEntityID(),
        emoji: '👍',
      }),
    );
    await kudosReactionsRepository.create(
      KudosReaction.create({
        tenantId: kudos.tenantId,
        kudosId: kudos.id,
        employeeId: new UniqueEntityID(),
        emoji: '🎉',
      }),
    );

    await kudosRepliesRepository.create(
      KudosReply.create({
        tenantId: kudos.tenantId,
        kudosId: kudos.id,
        employeeId: new UniqueEntityID(),
        content: 'Nice!',
      }),
    );

    const { items } = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(items[0].reactionsSummary).toHaveLength(2);
    expect(items[0].reactionsSummary[0]).toMatchObject({
      emoji: '👍',
      count: 2,
    });
    expect(items[0].repliesCount).toBe(1);
  });
});
