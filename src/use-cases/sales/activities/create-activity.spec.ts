import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryActivitiesRepository } from '@/repositories/sales/in-memory/in-memory-activities-repository';
import { InMemoryTimelineEventsRepository } from '@/repositories/sales/in-memory/in-memory-timeline-events-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateActivityUseCase } from './create-activity';

let activitiesRepository: InMemoryActivitiesRepository;
let timelineRepository: InMemoryTimelineEventsRepository;
let sut: CreateActivityUseCase;

describe('Create Activity Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    activitiesRepository = new InMemoryActivitiesRepository();
    timelineRepository = new InMemoryTimelineEventsRepository();
    sut = new CreateActivityUseCase(activitiesRepository, timelineRepository);
  });

  it('should create an activity', async () => {
    const { activity } = await sut.execute({
      tenantId: TENANT_ID,
      type: 'CALL',
      title: 'Follow up call',
      userId: 'user-1',
    });

    expect(activity.id.toString()).toEqual(expect.any(String));
    expect(activity.title).toBe('Follow up call');
    expect(activity.type).toBe('CALL');
    expect(activitiesRepository.items).toHaveLength(1);
  });

  it('should create timeline event when linked to a deal', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      dealId: 'deal-1',
      type: 'MEETING',
      title: 'Demo meeting',
      userId: 'user-1',
    });

    expect(timelineRepository.items).toHaveLength(1);
    expect(timelineRepository.items[0]!.type).toBe('ACTIVITY_CREATED');
  });

  it('should not create an activity with empty title', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        type: 'CALL',
        title: '',
        userId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should not create an activity with invalid type', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        type: 'INVALID',
        title: 'Test',
        userId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
