import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Activity } from '@/entities/sales/activity';
import { InMemoryActivitiesRepository } from '@/repositories/sales/in-memory/in-memory-activities-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListActivitiesUseCase } from './list-activities';

let activitiesRepository: InMemoryActivitiesRepository;
let sut: ListActivitiesUseCase;

describe('List Activities Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    activitiesRepository = new InMemoryActivitiesRepository();
    sut = new ListActivitiesUseCase(activitiesRepository);
  });

  it('should list activities with pagination', async () => {
    for (let i = 0; i < 5; i++) {
      activitiesRepository.items.push(
        Activity.create({
          tenantId: new UniqueEntityID(TENANT_ID),
          type: 'CALL',
          title: `Activity ${i}`,
          userId: new UniqueEntityID('user-1'),
        }),
      );
    }

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 3,
    });

    expect(result.activities).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('should return empty list when no activities', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 10,
    });

    expect(result.activities).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
