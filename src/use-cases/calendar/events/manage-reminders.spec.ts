import { describe, it, expect, beforeEach } from 'vitest';
import { ManageRemindersUseCase } from './manage-reminders';
import { InMemoryCalendarEventsRepository } from '@/repositories/calendar/in-memory/in-memory-calendar-events-repository';
import { InMemoryEventParticipantsRepository } from '@/repositories/calendar/in-memory/in-memory-event-participants-repository';
import { InMemoryEventRemindersRepository } from '@/repositories/calendar/in-memory/in-memory-event-reminders-repository';

let eventsRepo: InMemoryCalendarEventsRepository;
let participantsRepo: InMemoryEventParticipantsRepository;
let remindersRepo: InMemoryEventRemindersRepository;
let sut: ManageRemindersUseCase;

describe('ManageRemindersUseCase', () => {
  beforeEach(async () => {
    eventsRepo = new InMemoryCalendarEventsRepository();
    participantsRepo = new InMemoryEventParticipantsRepository();
    remindersRepo = new InMemoryEventRemindersRepository();
    sut = new ManageRemindersUseCase(
      eventsRepo,
      participantsRepo,
      remindersRepo,
    );

    await eventsRepo.create({
      tenantId: 'tenant-1',
      calendarId: 'calendar-1',
      title: 'Team Meeting',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-owner',
    });

    const eventId = eventsRepo.items[0].id.toString();

    await participantsRepo.create({
      eventId,
      userId: 'user-owner',
      role: 'OWNER',
      status: 'ACCEPTED',
      tenantId: 'tenant-1',
    });
  });

  it('should create reminders for a participant', async () => {
    const eventId = eventsRepo.items[0].id.toString();

    const result = await sut.execute({
      eventId,
      tenantId: 'tenant-1',
      userId: 'user-owner',
      reminders: [{ minutesBefore: 15 }, { minutesBefore: 60 }],
    });

    expect(result.count).toBe(2);
    expect(remindersRepo.items).toHaveLength(2);
  });

  it('should replace existing reminders', async () => {
    const eventId = eventsRepo.items[0].id.toString();

    // Create initial reminders
    await sut.execute({
      eventId,
      tenantId: 'tenant-1',
      userId: 'user-owner',
      reminders: [{ minutesBefore: 5 }, { minutesBefore: 10 }],
    });
    expect(remindersRepo.items).toHaveLength(2);

    // Replace with new ones
    const result = await sut.execute({
      eventId,
      tenantId: 'tenant-1',
      userId: 'user-owner',
      reminders: [{ minutesBefore: 30 }],
    });

    expect(result.count).toBe(1);
    expect(remindersRepo.items).toHaveLength(1);
    expect(remindersRepo.items[0].minutesBefore).toBe(30);
  });

  it('should reject if user is not a participant', async () => {
    const eventId = eventsRepo.items[0].id.toString();

    await expect(
      sut.execute({
        eventId,
        tenantId: 'tenant-1',
        userId: 'non-participant',
        reminders: [{ minutesBefore: 15 }],
      }),
    ).rejects.toThrow('You must be a participant to manage reminders');
  });

  it('should reject if event not found', async () => {
    await expect(
      sut.execute({
        eventId: 'non-existent',
        tenantId: 'tenant-1',
        userId: 'user-owner',
        reminders: [{ minutesBefore: 15 }],
      }),
    ).rejects.toThrow('Event not found');
  });

  it('should clear all reminders when passing empty array', async () => {
    const eventId = eventsRepo.items[0].id.toString();

    await sut.execute({
      eventId,
      tenantId: 'tenant-1',
      userId: 'user-owner',
      reminders: [{ minutesBefore: 15 }],
    });
    expect(remindersRepo.items).toHaveLength(1);

    const result = await sut.execute({
      eventId,
      tenantId: 'tenant-1',
      userId: 'user-owner',
      reminders: [],
    });

    expect(result.count).toBe(0);
    expect(remindersRepo.items).toHaveLength(0);
  });
});
