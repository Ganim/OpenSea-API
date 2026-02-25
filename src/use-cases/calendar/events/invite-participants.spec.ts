import { describe, it, expect, beforeEach } from 'vitest';
import { InviteParticipantsUseCase } from './invite-participants';
import { InMemoryCalendarEventsRepository } from '@/repositories/calendar/in-memory/in-memory-calendar-events-repository';
import { InMemoryEventParticipantsRepository } from '@/repositories/calendar/in-memory/in-memory-event-participants-repository';
import { InMemoryNotificationsRepository } from '@/repositories/notifications/in-memory/in-memory-notifications-repository';
import { InMemoryNotificationTemplatesRepository } from '@/repositories/notifications/in-memory/in-memory-notification-templates-repository';

let eventsRepo: InMemoryCalendarEventsRepository;
let participantsRepo: InMemoryEventParticipantsRepository;
let notificationsRepo: InMemoryNotificationsRepository;
let templatesRepo: InMemoryNotificationTemplatesRepository;
let sut: InviteParticipantsUseCase;

describe('InviteParticipantsUseCase', () => {
  beforeEach(async () => {
    eventsRepo = new InMemoryCalendarEventsRepository();
    participantsRepo = new InMemoryEventParticipantsRepository();
    notificationsRepo = new InMemoryNotificationsRepository();
    templatesRepo = new InMemoryNotificationTemplatesRepository();
    sut = new InviteParticipantsUseCase(
      eventsRepo,
      participantsRepo,
      notificationsRepo,
      templatesRepo,
    );

    // Create a template for invites
    await templatesRepo.create({
      code: 'calendar.event.invite',
      name: 'Calendar Event Invite',
      titleTemplate: 'Convite para evento',
      messageTemplate: '{{inviterName}} convidou você para "{{eventTitle}}"',
      defaultChannel: 'IN_APP',
    });

    // Create an event
    await eventsRepo.create({
      tenantId: 'tenant-1',
      title: 'Team Meeting',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-owner',
      participants: [{ userId: 'user-owner', role: 'OWNER' }],
    });

    // Manually add owner as participant
    await participantsRepo.create({
      eventId: eventsRepo.items[0].id.toString(),
      userId: 'user-owner',
      role: 'OWNER',
      status: 'ACCEPTED',
    });
  });

  it('should invite participants to an event', async () => {
    const eventId = eventsRepo.items[0].id.toString();

    const result = await sut.execute({
      eventId,
      tenantId: 'tenant-1',
      userId: 'user-owner',
      userName: 'João',
      participants: [
        { userId: 'user-2', role: 'GUEST' },
        { userId: 'user-3', role: 'ASSIGNEE' },
      ],
    });

    expect(result.invited).toBe(2);
    expect(participantsRepo.items).toHaveLength(3); // owner + 2 new
    expect(notificationsRepo.items).toHaveLength(2);
  });

  it('should skip already existing participants', async () => {
    const eventId = eventsRepo.items[0].id.toString();

    // Add user-2 as participant first
    await participantsRepo.create({
      eventId,
      userId: 'user-2',
      role: 'GUEST',
    });

    const result = await sut.execute({
      eventId,
      tenantId: 'tenant-1',
      userId: 'user-owner',
      participants: [{ userId: 'user-2' }, { userId: 'user-3' }],
    });

    expect(result.invited).toBe(1); // only user-3
  });

  it('should reject if user is not OWNER', async () => {
    const eventId = eventsRepo.items[0].id.toString();

    // Add a non-owner participant
    await participantsRepo.create({
      eventId,
      userId: 'user-guest',
      role: 'GUEST',
    });

    await expect(
      sut.execute({
        eventId,
        tenantId: 'tenant-1',
        userId: 'user-guest',
        participants: [{ userId: 'user-4' }],
      }),
    ).rejects.toThrow('Only the event owner can invite participants');
  });

  it('should reject if event not found', async () => {
    await expect(
      sut.execute({
        eventId: 'non-existent',
        tenantId: 'tenant-1',
        userId: 'user-owner',
        participants: [{ userId: 'user-2' }],
      }),
    ).rejects.toThrow('Event not found');
  });
});
