import { describe, it, expect, beforeEach } from 'vitest';
import { ShareEventWithTeamUseCase } from './share-event-with-team';
import { InMemoryCalendarEventsRepository } from '@/repositories/calendar/in-memory/in-memory-calendar-events-repository';
import { InMemoryEventParticipantsRepository } from '@/repositories/calendar/in-memory/in-memory-event-participants-repository';
import { InMemoryCalendarsRepository } from '@/repositories/calendar/in-memory/in-memory-calendars-repository';
import { InMemoryTeamCalendarConfigsRepository } from '@/repositories/calendar/in-memory/in-memory-team-calendar-configs-repository';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';

let eventsRepository: InMemoryCalendarEventsRepository;
let participantsRepository: InMemoryEventParticipantsRepository;
let calendarsRepository: InMemoryCalendarsRepository;
let teamCalendarConfigsRepository: InMemoryTeamCalendarConfigsRepository;
let sut: ShareEventWithTeamUseCase;

describe('ShareEventWithTeamUseCase', () => {
  beforeEach(() => {
    eventsRepository = new InMemoryCalendarEventsRepository();
    participantsRepository = new InMemoryEventParticipantsRepository();
    calendarsRepository = new InMemoryCalendarsRepository();
    teamCalendarConfigsRepository = new InMemoryTeamCalendarConfigsRepository();
    sut = new ShareEventWithTeamUseCase(
      eventsRepository,
      participantsRepository,
      calendarsRepository,
      teamCalendarConfigsRepository,
    );
  });

  it('should share event with all team members', async () => {
    const event = await eventsRepository.create({
      tenantId: 'tenant-1',
      calendarId: 'calendar-1',
      title: 'Team Meeting',
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

    const result = await sut.execute({
      eventId: event.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
      teamId: 'team-1',
      teamMembers: [
        { userId: 'user-2' },
        { userId: 'user-3' },
        { userId: 'user-4' },
      ],
    });

    expect(result.shared).toBe(3);
    expect(participantsRepository.items).toHaveLength(4);
  });

  it('should skip event owner when sharing with team', async () => {
    const event = await eventsRepository.create({
      tenantId: 'tenant-1',
      calendarId: 'calendar-1',
      title: 'Team Meeting',
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

    const result = await sut.execute({
      eventId: event.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
      teamId: 'team-1',
      teamMembers: [{ userId: 'user-1' }, { userId: 'user-2' }],
    });

    expect(result.shared).toBe(1);
  });

  it('should throw ResourceNotFoundError for non-existent event', async () => {
    await expect(
      sut.execute({
        eventId: 'non-existent',
        tenantId: 'tenant-1',
        userId: 'user-1',
        teamId: 'team-1',
        teamMembers: [{ userId: 'user-2' }],
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
        teamId: 'team-1',
        teamMembers: [{ userId: 'user-3' }],
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should share 0 when all members already exist', async () => {
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
      teamId: 'team-1',
      teamMembers: [{ userId: 'user-2' }],
    });

    expect(result.shared).toBe(0);
  });
});
