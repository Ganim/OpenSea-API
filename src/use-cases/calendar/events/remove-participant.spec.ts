import { describe, it, expect, beforeEach } from 'vitest';
import { RemoveParticipantUseCase } from './remove-participant';
import { InMemoryCalendarEventsRepository } from '@/repositories/calendar/in-memory/in-memory-calendar-events-repository';
import { InMemoryEventParticipantsRepository } from '@/repositories/calendar/in-memory/in-memory-event-participants-repository';
import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { InMemoryNotificationTemplatesRepository } from '@/repositories/notifications/in-memory/in-memory-notification-templates-repository';

let eventsRepo: InMemoryCalendarEventsRepository;
let participantsRepo: InMemoryEventParticipantsRepository;
let notificationsRepo: InMemoryNotificationsRepository;
let templatesRepo: InMemoryNotificationTemplatesRepository;
let sut: RemoveParticipantUseCase;

describe('RemoveParticipantUseCase', () => {
  beforeEach(async () => {
    eventsRepo = new InMemoryCalendarEventsRepository();
    participantsRepo = new InMemoryEventParticipantsRepository();
    notificationsRepo = new InMemoryNotificationsRepository();
    templatesRepo = new InMemoryNotificationTemplatesRepository();
    sut = new RemoveParticipantUseCase(
      eventsRepo,
      participantsRepo,
      notificationsRepo,
      templatesRepo,
    );

    await templatesRepo.create({
      code: 'calendar.event.removed',
      name: 'Calendar Event Removed',
      titleTemplate: 'Removido do evento',
      messageTemplate: 'Você foi removido do evento "{{eventTitle}}"',
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
      status: 'ACCEPTED',
      tenantId: 'tenant-1',
    });
  });

  it('should remove a participant', async () => {
    const eventId = eventsRepo.items[0].id.toString();

    const result = await sut.execute({
      eventId,
      tenantId: 'tenant-1',
      userId: 'user-owner',
      participantUserId: 'user-guest',
    });

    expect(result.removed).toBe(true);
    expect(participantsRepo.items).toHaveLength(1); // only owner left
    expect(notificationsRepo.items).toHaveLength(1);
  });

  it('should reject if requester is not OWNER', async () => {
    const eventId = eventsRepo.items[0].id.toString();

    await expect(
      sut.execute({
        eventId,
        tenantId: 'tenant-1',
        userId: 'user-guest',
        participantUserId: 'user-owner',
      }),
    ).rejects.toThrow('Only the event owner can remove participants');
  });

  it('should reject removing the OWNER', async () => {
    const eventId = eventsRepo.items[0].id.toString();

    await expect(
      sut.execute({
        eventId,
        tenantId: 'tenant-1',
        userId: 'user-owner',
        participantUserId: 'user-owner',
      }),
    ).rejects.toThrow('Cannot remove the event owner');
  });

  it('should reject if participant not found', async () => {
    const eventId = eventsRepo.items[0].id.toString();

    await expect(
      sut.execute({
        eventId,
        tenantId: 'tenant-1',
        userId: 'user-owner',
        participantUserId: 'non-existent',
      }),
    ).rejects.toThrow('Participant not found');
  });
});
