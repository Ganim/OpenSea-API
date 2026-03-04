import { describe, it, expect, beforeEach } from 'vitest';
import { ShareEventWithUsersUseCase } from './share-event-with-users';
import { InMemoryCalendarEventsRepository } from '@/repositories/calendar/in-memory/in-memory-calendar-events-repository';
import { InMemoryEventParticipantsRepository } from '@/repositories/calendar/in-memory/in-memory-event-participants-repository';
import { InMemoryCalendarsRepository } from '@/repositories/calendar/in-memory/in-memory-calendars-repository';
import { InMemoryTeamCalendarConfigsRepository } from '@/repositories/calendar/in-memory/in-memory-team-calendar-configs-repository';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

let eventsRepository: InMemoryCalendarEventsRepository;
let participantsRepository: InMemoryEventParticipantsRepository;
let calendarsRepository: InMemoryCalendarsRepository;
let teamCalendarConfigsRepository: InMemoryTeamCalendarConfigsRepository;
let sut: ShareEventWithUsersUseCase;

describe('ShareEventWithUsersUseCase', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryCalendarEventsRepository();
    participantsRepository = new InMemoryEventParticipantsRepository();
    calendarsRepository = new InMemoryCalendarsRepository();
    teamCalendarConfigsRepository = new InMemoryTeamCalendarConfigsRepository();
    sut = new ShareEventWithUsersUseCase(
      eventsRepository,
      participantsRepository,
      calendarsRepository,
      teamCalendarConfigsRepository,
    );
  });

  it('should share event with users (event without calendar)', async () => {
    const event = await eventsRepository.create({
      tenantId: 'tenant-1',
      calendarId: 'calendar-1',
      title: 'Meeting',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
    });

    // Create owner participant
    await participantsRepository.create({
      tenantId: 'tenant-1',
      eventId: event.id.toString(),
      userId: 'user-1',
      role: 'OWNER',
      status: 'ACCEPTED',
    });

    const result = await sut.execute({
      eventId: event.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
      targetUserIds: ['user-2', 'user-3'],
    });

    expect(result.shared).toBe(2);
    expect(participantsRepository.items).toHaveLength(3);
  });

  it('should skip already existing participants', async () => {
    const event = await eventsRepository.create({
      tenantId: 'tenant-1',
      calendarId: 'calendar-1',
      title: 'Meeting',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
    });

    await participantsRepository.create({
      tenantId: 'tenant-1',
      eventId: event.id.toString(),
      userId: 'user-1',
      role: 'OWNER',
      status: 'ACCEPTED',
    });

    await participantsRepository.create({
      tenantId: 'tenant-1',
      eventId: event.id.toString(),
      userId: 'user-2',
      role: 'GUEST',
      status: 'PENDING',
    });

    const result = await sut.execute({
      eventId: event.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
      targetUserIds: ['user-2', 'user-3'],
    });

    expect(result.shared).toBe(1);
    expect(participantsRepository.items).toHaveLength(3);
  });

  it('should throw ResourceNotFoundError for non-existent event', async () => {
    await expect(
      sut.execute({
        eventId: 'non-existent',
        tenantId: 'tenant-1',
        userId: 'user-1',
        targetUserIds: ['user-2'],
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ForbiddenError when non-owner tries to share (no calendar)', async () => {
    const event = await eventsRepository.create({
      tenantId: 'tenant-1',
      calendarId: 'calendar-1',
      title: 'Meeting',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
    });

    await participantsRepository.create({
      tenantId: 'tenant-1',
      eventId: event.id.toString(),
      userId: 'user-1',
      role: 'OWNER',
      status: 'ACCEPTED',
    });

    await expect(
      sut.execute({
        eventId: event.id.toString(),
        tenantId: 'tenant-1',
        userId: 'user-2',
        targetUserIds: ['user-3'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw BadRequestError for empty targetUserIds', async () => {
    const event = await eventsRepository.create({
      tenantId: 'tenant-1',
      calendarId: 'calendar-1',
      title: 'Meeting',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
    });

    await participantsRepository.create({
      tenantId: 'tenant-1',
      eventId: event.id.toString(),
      userId: 'user-1',
      role: 'OWNER',
      status: 'ACCEPTED',
    });

    await expect(
      sut.execute({
        eventId: event.id.toString(),
        tenantId: 'tenant-1',
        userId: 'user-1',
        targetUserIds: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should share using canShare from calendar access (personal)', async () => {
    const calendar = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Meu Calendário',
      type: 'PERSONAL',
      ownerId: 'user-1',
      createdBy: 'user-1',
    });

    const event = await eventsRepository.create({
      tenantId: 'tenant-1',
      calendarId: calendar.id.toString(),
      title: 'Meeting',
      startDate: new Date('2026-03-01T10:00:00'),
      endDate: new Date('2026-03-01T11:00:00'),
      createdBy: 'user-1',
    });

    const result = await sut.execute({
      eventId: event.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
      targetUserIds: ['user-2'],
    });

    expect(result.shared).toBe(1);
  });
});
