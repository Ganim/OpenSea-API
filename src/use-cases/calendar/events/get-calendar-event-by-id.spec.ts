import { describe, it, expect, beforeEach } from 'vitest';
import { GetCalendarEventByIdUseCase } from './get-calendar-event-by-id';
import { InMemoryCalendarEventsRepository } from '@/repositories/calendar/in-memory/in-memory-calendar-events-repository';
import { InMemoryEventParticipantsRepository } from '@/repositories/calendar/in-memory/in-memory-event-participants-repository';

let eventsRepository: InMemoryCalendarEventsRepository;
let participantsRepository: InMemoryEventParticipantsRepository;
let sut: GetCalendarEventByIdUseCase;

describe('GetCalendarEventByIdUseCase', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryCalendarEventsRepository();
    participantsRepository = new InMemoryEventParticipantsRepository();
    sut = new GetCalendarEventByIdUseCase(
      eventsRepository,
      participantsRepository,
    );
  });

  it('should get a calendar event by id', async () => {
    const created = await eventsRepository.create({
      tenantId: 'tenant-1',
      calendarId: 'calendar-1',
      title: 'My Event',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
    });

    const { event } = await sut.execute({
      id: created.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(event.title).toBe('My Event');
  });

  it('should return "Ocupado" for private events to non-participants', async () => {
    const created = await eventsRepository.create({
      tenantId: 'tenant-1',
      calendarId: 'calendar-1',
      title: 'Secret Meeting',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
      visibility: 'PRIVATE',
    });

    const { event } = await sut.execute({
      id: created.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-2',
    });

    expect(event.title).toBe('Ocupado');
    expect(event.description).toBeNull();
    expect(event.location).toBeNull();
    expect(event.participants).toEqual([]);
    expect(event.reminders).toEqual([]);
  });

  it('should show full details of private event to participants', async () => {
    const created = await eventsRepository.create({
      tenantId: 'tenant-1',
      calendarId: 'calendar-1',
      title: 'Secret Meeting',
      description: 'Confidential discussion',
      location: 'Room 42',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
      visibility: 'PRIVATE',
    });

    await participantsRepository.create({
      eventId: created.id.toString(),
      userId: 'user-2',
      role: 'GUEST',
      tenantId: 'tenant-1',
    });

    const { event } = await sut.execute({
      id: created.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-2',
    });

    expect(event.title).toBe('Secret Meeting');
    expect(event.description).toBe('Confidential discussion');
    expect(event.location).toBe('Room 42');
  });

  it('should show full details of private event to creator', async () => {
    const created = await eventsRepository.create({
      tenantId: 'tenant-1',
      calendarId: 'calendar-1',
      title: 'My Private Event',
      description: 'Only for me',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
      visibility: 'PRIVATE',
    });

    const { event } = await sut.execute({
      id: created.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
    });

    expect(event.title).toBe('My Private Event');
    expect(event.description).toBe('Only for me');
  });

  it('should throw for non-existent event', async () => {
    await expect(
      sut.execute({
        id: 'non-existent',
        tenantId: 'tenant-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow('Event not found');
  });

  describe('Multi-tenant isolation', () => {
    it('should not return event from another tenant', async () => {
      const created = await eventsRepository.create({
        tenantId: 'tenant-1',
        calendarId: 'calendar-1',
        title: 'Tenant 1 Only',
        startDate: new Date('2026-03-01T10:00:00'),
        endDate: new Date('2026-03-01T11:00:00'),
        createdBy: 'user-1',
      });

      await expect(
        sut.execute({
          id: created.id.toString(),
          tenantId: 'tenant-2',
          userId: 'user-2',
        }),
      ).rejects.toThrow('Event not found');
    });
  });
});
