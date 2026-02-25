import { describe, it, expect, beforeEach } from 'vitest';
import { CreateCalendarEventUseCase } from './create-calendar-event';
import { InMemoryCalendarEventsRepository } from '@/repositories/calendar/in-memory/in-memory-calendar-events-repository';

let repository: InMemoryCalendarEventsRepository;
let sut: CreateCalendarEventUseCase;

describe('CreateCalendarEventUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCalendarEventsRepository();
    sut = new CreateCalendarEventUseCase(repository);
  });

  it('should create a calendar event', async () => {
    const { event } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      title: 'Team Meeting',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      type: 'MEETING',
    });

    expect(event.title).toBe('Team Meeting');
    expect(event.type).toBe('MEETING');
    expect(repository.items).toHaveLength(1);
  });

  it('should reject empty title', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        title: '',
        startDate: new Date('2026-03-01T10:00:00'),
        endDate: new Date('2026-03-01T11:00:00'),
      }),
    ).rejects.toThrow('Event title is required');
  });

  it('should reject endDate before startDate', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        title: 'Test',
        startDate: new Date('2026-03-01T11:00:00'),
        endDate: new Date('2026-03-01T10:00:00'),
      }),
    ).rejects.toThrow('End date must be after start date');
  });

  it('should set default type and visibility', async () => {
    const { event } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      title: 'Simple Event',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
    });

    expect(event.type).toBe('CUSTOM');
    expect(event.visibility).toBe('PUBLIC');
  });
});
