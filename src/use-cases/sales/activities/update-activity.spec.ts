import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Activity } from '@/entities/sales/activity';
import { InMemoryActivitiesRepository } from '@/repositories/sales/in-memory/in-memory-activities-repository';
import { InMemoryTimelineEventsRepository } from '@/repositories/sales/in-memory/in-memory-timeline-events-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateActivityUseCase } from './update-activity';

let activitiesRepository: InMemoryActivitiesRepository;
let timelineRepository: InMemoryTimelineEventsRepository;
let sut: UpdateActivityUseCase;

describe('Update Activity Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    activitiesRepository = new InMemoryActivitiesRepository();
    timelineRepository = new InMemoryTimelineEventsRepository();
    sut = new UpdateActivityUseCase(activitiesRepository, timelineRepository);
  });

  it('should update an activity title', async () => {
    const activity = Activity.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      type: 'CALL',
      title: 'Old Title',
      userId: new UniqueEntityID('user-1'),
    });
    activitiesRepository.items.push(activity);

    const result = await sut.execute({
      id: activity.id.toString(),
      tenantId: TENANT_ID,
      title: 'New Title',
    });

    expect(result.activity.title).toBe('New Title');
  });

  it('should create timeline event when completing activity linked to deal', async () => {
    const activity = Activity.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      dealId: new UniqueEntityID('deal-1'),
      type: 'CALL',
      title: 'Call',
      userId: new UniqueEntityID('user-1'),
    });
    activitiesRepository.items.push(activity);

    await sut.execute({
      id: activity.id.toString(),
      tenantId: TENANT_ID,
      status: 'COMPLETED',
    });

    expect(timelineRepository.items).toHaveLength(1);
    expect(timelineRepository.items[0]!.type).toBe('ACTIVITY_COMPLETED');
  });

  it('should throw if activity not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: TENANT_ID, title: 'Test' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
