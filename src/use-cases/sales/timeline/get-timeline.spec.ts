import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { TimelineEvent } from '@/entities/sales/timeline-event';
import { InMemoryActivitiesRepository } from '@/repositories/sales/in-memory/in-memory-activities-repository';
import { InMemoryTimelineEventsRepository } from '@/repositories/sales/in-memory/in-memory-timeline-events-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetTimelineUseCase } from './get-timeline';

let activitiesRepository: InMemoryActivitiesRepository;
let timelineEventsRepository: InMemoryTimelineEventsRepository;
let sut: GetTimelineUseCase;

const TENANT_ID = 'tenant-1';

describe('GetTimelineUseCase', () => {
  beforeEach(() => {
    activitiesRepository = new InMemoryActivitiesRepository();
    timelineEventsRepository = new InMemoryTimelineEventsRepository();
    sut = new GetTimelineUseCase(
      activitiesRepository,
      timelineEventsRepository,
    );
  });

  it('should return activities and timeline events merged, sorted by date desc', async () => {
    // Create activity (older)
    await activitiesRepository.create({
      tenantId: TENANT_ID,
      type: 'NOTE',
      title: 'Activity note',
      contactId: 'contact-1',
      performedAt: new Date('2026-03-10T10:00:00Z'),
    });

    // Create timeline event (newer)
    const event = TimelineEvent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      type: 'DEAL_STAGE_CHANGED',
      title: 'Deal moved to negotiation',
      contactId: new UniqueEntityID('contact-1'),
      source: 'SYSTEM',
      createdAt: new Date('2026-03-15T10:00:00Z'),
    });
    await timelineEventsRepository.create(event);

    // Create another activity (newest)
    await activitiesRepository.create({
      tenantId: TENANT_ID,
      type: 'CALL',
      title: 'Follow-up call',
      contactId: 'contact-1',
      performedAt: new Date('2026-03-20T10:00:00Z'),
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      contactId: 'contact-1',
      page: 1,
      limit: 20,
    });

    expect(result.items).toHaveLength(3);
    expect(result.meta.total).toBe(3);

    // Should be sorted by date desc
    expect(result.items[0].title).toBe('Follow-up call');
    expect(result.items[0].type).toBe('activity');
    expect(result.items[1].title).toBe('Deal moved to negotiation');
    expect(result.items[1].type).toBe('timeline_event');
    expect(result.items[2].title).toBe('Activity note');
    expect(result.items[2].type).toBe('activity');
  });

  it('should filter by contactId', async () => {
    await activitiesRepository.create({
      tenantId: TENANT_ID,
      type: 'NOTE',
      title: 'Contact 1 note',
      contactId: 'contact-1',
    });

    await activitiesRepository.create({
      tenantId: TENANT_ID,
      type: 'NOTE',
      title: 'Contact 2 note',
      contactId: 'contact-2',
    });

    const event = TimelineEvent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      type: 'EMAIL_RECEIVED',
      title: 'Email from contact 1',
      contactId: new UniqueEntityID('contact-1'),
      source: 'SYSTEM',
    });
    await timelineEventsRepository.create(event);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      contactId: 'contact-1',
      page: 1,
      limit: 20,
    });

    expect(result.items).toHaveLength(2);
    expect(
      result.items.every(
        (i) => i.title.includes('Contact 1') || i.title.includes('contact 1'),
      ),
    ).toBe(true);
  });

  it('should filter by dealId', async () => {
    await activitiesRepository.create({
      tenantId: TENANT_ID,
      type: 'MEETING',
      title: 'Deal meeting',
      dealId: 'deal-1',
      performedAt: new Date('2026-03-10T10:00:00Z'),
    });

    await activitiesRepository.create({
      tenantId: TENANT_ID,
      type: 'NOTE',
      title: 'Other note',
      contactId: 'contact-1',
    });

    const event = TimelineEvent.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      type: 'DEAL_CREATED',
      title: 'Deal created',
      dealId: new UniqueEntityID('deal-1'),
      source: 'SYSTEM',
      createdAt: new Date('2026-03-15T10:00:00Z'),
    });
    await timelineEventsRepository.create(event);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      dealId: 'deal-1',
      page: 1,
      limit: 20,
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe('Deal created');
    expect(result.items[1].title).toBe('Deal meeting');
  });

  it('should paginate merged results', async () => {
    // Create 3 activities
    for (let i = 0; i < 3; i++) {
      await activitiesRepository.create({
        tenantId: TENANT_ID,
        type: 'NOTE',
        title: `Activity ${i + 1}`,
        contactId: 'contact-1',
        performedAt: new Date(`2026-03-${10 + i}T10:00:00Z`),
      });
    }

    // Create 2 timeline events
    for (let i = 0; i < 2; i++) {
      const event = TimelineEvent.create({
        tenantId: new UniqueEntityID(TENANT_ID),
        type: 'STATUS_CHANGE',
        title: `Event ${i + 1}`,
        contactId: new UniqueEntityID('contact-1'),
        source: 'SYSTEM',
        createdAt: new Date(`2026-03-${15 + i}T10:00:00Z`),
      });
      await timelineEventsRepository.create(event);
    }

    // Page 1 with limit 2
    const page1 = await sut.execute({
      tenantId: TENANT_ID,
      contactId: 'contact-1',
      page: 1,
      limit: 2,
    });

    expect(page1.items).toHaveLength(2);
    expect(page1.meta.total).toBe(5);
    expect(page1.meta.totalPages).toBe(3);

    // Page 2
    const page2 = await sut.execute({
      tenantId: TENANT_ID,
      contactId: 'contact-1',
      page: 2,
      limit: 2,
    });

    expect(page2.items).toHaveLength(2);

    // Page 3 (last)
    const page3 = await sut.execute({
      tenantId: TENANT_ID,
      contactId: 'contact-1',
      page: 3,
      limit: 2,
    });

    expect(page3.items).toHaveLength(1);
  });

  it('should return empty timeline when no items match', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      contactId: 'non-existent',
      page: 1,
      limit: 20,
    });

    expect(result.items).toHaveLength(0);
    expect(result.meta.total).toBe(0);
    expect(result.meta.totalPages).toBe(0);
  });
});
