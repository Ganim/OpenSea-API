import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmployeeKudos } from '@/entities/hr/employee-kudos';
import { InMemoryEmployeeKudosRepository } from '@/repositories/hr/in-memory/in-memory-employee-kudos-repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { ListKudosFeedUseCase } from './list-kudos-feed';

let employeeKudosRepository: InMemoryEmployeeKudosRepository;
let listKudosFeedUseCase: ListKudosFeedUseCase;

const TENANT_ID = new UniqueEntityID().toString();

function createTestKudos(
  overrides: {
    tenantId?: string;
    isPublic?: boolean;
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
  });
}

describe('ListKudosFeedUseCase', () => {
  beforeEach(() => {
    employeeKudosRepository = new InMemoryEmployeeKudosRepository();
    listKudosFeedUseCase = new ListKudosFeedUseCase(employeeKudosRepository);
  });

  it('should list public kudos for the tenant feed', async () => {
    await employeeKudosRepository.create(createTestKudos());

    const { kudos, total } = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(kudos).toHaveLength(1);
    expect(total).toBe(1);
  });

  it('should return empty list when no public kudos exist', async () => {
    const { kudos, total } = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(kudos).toHaveLength(0);
    expect(total).toBe(0);
  });

  it('should exclude private kudos from the feed', async () => {
    await employeeKudosRepository.create(createTestKudos({ isPublic: true }));
    await employeeKudosRepository.create(createTestKudos({ isPublic: false }));

    const { kudos, total } = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(kudos).toHaveLength(1);
    expect(total).toBe(1);
    expect(kudos[0].isPublic).toBe(true);
  });

  it('should only return kudos for the specified tenant', async () => {
    const differentTenantId = new UniqueEntityID().toString();

    await employeeKudosRepository.create(createTestKudos());
    await employeeKudosRepository.create(
      createTestKudos({ tenantId: differentTenantId }),
    );

    const { kudos, total } = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(kudos).toHaveLength(1);
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

    expect(firstPage.kudos).toHaveLength(2);
    expect(firstPage.total).toBe(5);

    const secondPage = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 2,
      limit: 2,
    });

    expect(secondPage.kudos).toHaveLength(2);
    expect(secondPage.total).toBe(5);

    const thirdPage = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 3,
      limit: 2,
    });

    expect(thirdPage.kudos).toHaveLength(1);
    expect(thirdPage.total).toBe(5);
  });

  it('should return empty array for page beyond total', async () => {
    await employeeKudosRepository.create(createTestKudos());

    const { kudos, total } = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 10,
      limit: 20,
    });

    expect(kudos).toHaveLength(0);
    expect(total).toBe(1);
  });

  it('should sort feed by most recent first', async () => {
    // The in-memory repository sorts by createdAt desc
    const olderKudos = createTestKudos();
    await employeeKudosRepository.create(olderKudos);

    // Small delay to ensure different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));

    const newerKudos = createTestKudos();
    await employeeKudosRepository.create(newerKudos);

    const { kudos } = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(kudos).toHaveLength(2);
    expect(kudos[0].createdAt.getTime()).toBeGreaterThanOrEqual(
      kudos[1].createdAt.getTime(),
    );
  });

  it('should show kudos from multiple senders and recipients in the feed', async () => {
    const senderA = new UniqueEntityID().toString();
    const senderB = new UniqueEntityID().toString();
    const recipientA = new UniqueEntityID().toString();
    const recipientB = new UniqueEntityID().toString();

    await employeeKudosRepository.create(
      createTestKudos({
        fromEmployeeId: senderA,
        toEmployeeId: recipientA,
      }),
    );
    await employeeKudosRepository.create(
      createTestKudos({
        fromEmployeeId: senderB,
        toEmployeeId: recipientB,
      }),
    );

    const { kudos, total } = await listKudosFeedUseCase.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(kudos).toHaveLength(2);
    expect(total).toBe(2);
  });
});
