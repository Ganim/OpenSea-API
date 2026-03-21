import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Activity } from '@/entities/sales/activity';
import { InMemoryActivitiesRepository } from '@/repositories/sales/in-memory/in-memory-activities-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteActivityUseCase } from './delete-activity';

let activitiesRepository: InMemoryActivitiesRepository;
let sut: DeleteActivityUseCase;

describe('Delete Activity Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    activitiesRepository = new InMemoryActivitiesRepository();
    sut = new DeleteActivityUseCase(activitiesRepository);
  });

  it('should delete an activity', async () => {
    const activity = Activity.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      type: 'CALL',
      title: 'Call to delete',
      userId: new UniqueEntityID('user-1'),
    });
    activitiesRepository.items.push(activity);

    await sut.execute({ id: activity.id.toString(), tenantId: TENANT_ID });

    // Activity uses soft-delete
    const found = await activitiesRepository.findById(activity.id, TENANT_ID);
    expect(found).toBeNull();
  });

  it('should throw if activity not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: TENANT_ID }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
