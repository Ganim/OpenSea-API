import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateCalendarEventUseCase } from './update-calendar-event';
import { InMemoryCalendarEventsRepository } from '@/repositories/calendar/in-memory/in-memory-calendar-events-repository';

let repository: InMemoryCalendarEventsRepository;
let sut: UpdateCalendarEventUseCase;

describe('UpdateCalendarEventUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCalendarEventsRepository();
    sut = new UpdateCalendarEventUseCase(repository);
  });

  it('should update a calendar event', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      title: 'Original Title',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
    });

    const { event } = await sut.execute({
      id: created.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
      title: 'Updated Title',
    });

    expect(event.title).toBe('Updated Title');
  });

  it('should reject update of non-existent event', async () => {
    await expect(
      sut.execute({
        id: 'non-existent',
        tenantId: 'tenant-1',
        userId: 'user-1',
        title: 'Test',
      }),
    ).rejects.toThrow('Event not found');
  });

  it('should reject update of system event', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      title: 'System Event',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
      systemSourceType: 'HR',
      systemSourceId: 'vacation-123',
    });

    await expect(
      sut.execute({
        id: created.id.toString(),
        tenantId: 'tenant-1',
        userId: 'user-1',
        title: 'Updated',
      }),
    ).rejects.toThrow('System events cannot be edited');
  });

  it('should reject update by non-creator', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      title: 'My Event',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
    });

    await expect(
      sut.execute({
        id: created.id.toString(),
        tenantId: 'tenant-1',
        userId: 'user-2',
        title: 'Hijacked',
      }),
    ).rejects.toThrow('Only the event creator can update this event');
  });
});
