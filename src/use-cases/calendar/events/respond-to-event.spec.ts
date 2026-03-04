import { describe, it, expect, beforeEach } from 'vitest';
import { RespondToEventUseCase } from './respond-to-event';
import { InMemoryCalendarEventsRepository } from '@/repositories/calendar/in-memory/in-memory-calendar-events-repository';
import { InMemoryEventParticipantsRepository } from '@/repositories/calendar/in-memory/in-memory-event-participants-repository';
import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { InMemoryNotificationTemplatesRepository } from '@/repositories/notifications/in-memory/in-memory-notification-templates-repository';

let eventsRepo: InMemoryCalendarEventsRepository;
let participantsRepo: InMemoryEventParticipantsRepository;
let notificationsRepo: InMemoryNotificationsRepository;
let templatesRepo: InMemoryNotificationTemplatesRepository;
let sut: RespondToEventUseCase;

describe('RespondToEventUseCase', () => {
  beforeEach(async () => {
    eventsRepo = new InMemoryCalendarEventsRepository();
    participantsRepo = new InMemoryEventParticipantsRepository();
    notificationsRepo = new InMemoryNotificationsRepository();
    templatesRepo = new InMemoryNotificationTemplatesRepository();
    sut = new RespondToEventUseCase(
      eventsRepo,
      participantsRepo,
      notificationsRepo,
      templatesRepo,
    );

    await templatesRepo.create({
      code: 'calendar.event.rsvp',
      name: 'Calendar Event RSVP',
      titleTemplate: 'Resposta ao convite',
      messageTemplate:
        '{{participantName}} {{status}} o convite para "{{eventTitle}}"',
      defaultChannel: 'IN_APP',
    });

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

    await participantsRepo.create({
      eventId,
      userId: 'user-guest',
      role: 'GUEST',
      status: 'PENDING',
      tenantId: 'tenant-1',
    });
  });

  it('should accept an event invite', async () => {
    const eventId = eventsRepo.items[0].id.toString();

    const result = await sut.execute({
      eventId,
      tenantId: 'tenant-1',
      userId: 'user-guest',
      userName: 'Maria',
      status: 'ACCEPTED',
    });

    expect(result.status).toBe('ACCEPTED');
    const participant = await participantsRepo.findByEventAndUser(
      eventId,
      'user-guest',
    );
    expect(participant?.status).toBe('ACCEPTED');
    expect(participant?.respondedAt).toBeTruthy();
  });

  it('should decline an event invite', async () => {
    const eventId = eventsRepo.items[0].id.toString();

    const result = await sut.execute({
      eventId,
      tenantId: 'tenant-1',
      userId: 'user-guest',
      status: 'DECLINED',
    });

    expect(result.status).toBe('DECLINED');
  });

  it('should reject if owner tries to respond', async () => {
    const eventId = eventsRepo.items[0].id.toString();

    await expect(
      sut.execute({
        eventId,
        tenantId: 'tenant-1',
        userId: 'user-owner',
        status: 'ACCEPTED',
      }),
    ).rejects.toThrow('Event owner cannot respond to their own event');
  });

  it('should reject if user is not a participant', async () => {
    const eventId = eventsRepo.items[0].id.toString();

    await expect(
      sut.execute({
        eventId,
        tenantId: 'tenant-1',
        userId: 'user-random',
        status: 'ACCEPTED',
      }),
    ).rejects.toThrow('You are not a participant of this event');
  });

  it('should notify the event creator', async () => {
    const eventId = eventsRepo.items[0].id.toString();

    await sut.execute({
      eventId,
      tenantId: 'tenant-1',
      userId: 'user-guest',
      userName: 'Maria',
      status: 'ACCEPTED',
    });

    expect(notificationsRepo.items).toHaveLength(1);
    expect(notificationsRepo.items[0].userId.toString()).toBe('user-owner');
  });
});
