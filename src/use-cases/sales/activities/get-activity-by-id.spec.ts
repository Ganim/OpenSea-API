import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Activity } from '@/entities/sales/activity';
import { InMemoryActivitiesRepository } from '@/repositories/sales/in-memory/in-memory-activities-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetActivityByIdUseCase } from './get-activity-by-id';

let activitiesRepository: InMemoryActivitiesRepository;
let sut: GetActivityByIdUseCase;

describe('Get Activity By Id Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    activitiesRepository = new InMemoryActivitiesRepository();
    sut = new GetActivityByIdUseCase(activitiesRepository);
  });

  it('should get an activity by id', async () => {
    const activity = Activity.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      type: 'MEETING',
      title: 'Demo meeting',
      userId: new UniqueEntityID('user-1'),
    });
    activitiesRepository.items.push(activity);

    const result = await sut.execute({
      id: activity.id.toString(),
      tenantId: TENANT_ID,
    });

    expect(result.activity.title).toBe('Demo meeting');
    expect(result.activity.type).toBe('MEETING');
  });

  it('should throw if activity not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: TENANT_ID }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
