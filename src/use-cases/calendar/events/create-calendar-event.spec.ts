import { describe, it, expect, beforeEach } from 'vitest';
import { CreateCalendarEventUseCase } from './create-calendar-event';
import { InMemoryCalendarEventsRepository } from '@/repositories/calendar/in-memory/in-memory-calendar-events-repository';
import { InMemoryCalendarsRepository } from '@/repositories/calendar/in-memory/in-memory-calendars-repository';

let repository: InMemoryCalendarEventsRepository;
let calendarsRepository: InMemoryCalendarsRepository;
let sut: CreateCalendarEventUseCase;
let calendarId: string;

describe('CreateCalendarEventUseCase', () => {
  beforeEach(async () => {
    repository = new InMemoryCalendarEventsRepository();
    calendarsRepository = new InMemoryCalendarsRepository();
    sut = new CreateCalendarEventUseCase(repository, calendarsRepository);

    // Seed a calendar for the tenant
    const calendar = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Personal',
      type: 'PERSONAL',
      createdBy: 'user-1',
    });
    calendarId = calendar.id.toString();
  });

  it('should create a calendar event', async () => {
    const { event } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      calendarId,
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
        calendarId,
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
        calendarId,
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
      calendarId,
      title: 'Simple Event',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
    });

    expect(event.type).toBe('CUSTOM');
    expect(event.visibility).toBe('PUBLIC');
  });

  it('should reject calendarId from another tenant', async () => {
    const otherCalendar = await calendarsRepository.create({
      tenantId: 'tenant-2',
      name: 'Other',
      type: 'PERSONAL',
      createdBy: 'user-2',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        calendarId: otherCalendar.id.toString(),
        title: 'Cross-tenant event',
        startDate: new Date('2026-03-01T10:00:00'),
        endDate: new Date('2026-03-01T11:00:00'),
      }),
    ).rejects.toThrow('Calendar not found');
  });
});
