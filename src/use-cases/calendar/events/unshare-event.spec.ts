import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnshareEventUseCase } from './unshare-event';

const tenantId = 'tenant-1';
const userId = 'user-1';
const eventId = 'event-1';
const targetUserId = 'target-1';

function makeMocks() {
  const calendarEventsRepository = { findById: vi.fn() } as unknown;
  const eventParticipantsRepository = {
    findByEventAndUser: vi.fn(),
    delete: vi.fn(),
  } as unknown;
  const calendarsRepository = { findById: vi.fn() } as unknown;
  const teamCalendarConfigsRepository = {
    findByTeamAndCalendar: vi.fn(),
  } as unknown;

  const sut = new UnshareEventUseCase(
    calendarEventsRepository,
    eventParticipantsRepository,
    calendarsRepository,
    teamCalendarConfigsRepository,
  );

  return {
    sut,
    calendarEventsRepository,
    eventParticipantsRepository,
    calendarsRepository,
    teamCalendarConfigsRepository,
  };
}

describe('UnshareEventUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
  });

  it('should unshare an event from a GUEST participant (no calendar)', async () => {
    mocks.calendarEventsRepository.findById.mockResolvedValue({
      id: new UniqueEntityID(eventId),
      calendarId: null,
    });
    // Owner check
    mocks.eventParticipantsRepository.findByEventAndUser
      .mockResolvedValueOnce({
        id: new UniqueEntityID('p-owner'),
        role: 'OWNER',
      }) // owner participant
      .mockResolvedValueOnce({
        id: new UniqueEntityID('p-target'),
        role: 'GUEST',
      }); // target participant
    mocks.eventParticipantsRepository.delete.mockResolvedValue(undefined);

    const result = await mocks.sut.execute({
      eventId,
      tenantId,
      userId,
      targetUserId,
    });

    expect(result.removed).toBe(true);
    expect(mocks.eventParticipantsRepository.delete).toHaveBeenCalled();
  });

  it('should throw ResourceNotFoundError when event does not exist', async () => {
    mocks.calendarEventsRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.sut.execute({ eventId, tenantId, userId, targetUserId }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ForbiddenError when user is not the event owner (no calendar)', async () => {
    mocks.calendarEventsRepository.findById.mockResolvedValue({
      id: new UniqueEntityID(eventId),
      calendarId: null,
    });
    mocks.eventParticipantsRepository.findByEventAndUser.mockResolvedValueOnce({
      id: new UniqueEntityID('p-1'),
      role: 'GUEST',
    });

    await expect(
      mocks.sut.execute({ eventId, tenantId, userId, targetUserId }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw ResourceNotFoundError when target participant does not exist', async () => {
    mocks.calendarEventsRepository.findById.mockResolvedValue({
      id: new UniqueEntityID(eventId),
      calendarId: null,
    });
    mocks.eventParticipantsRepository.findByEventAndUser
      .mockResolvedValueOnce({
        id: new UniqueEntityID('p-owner'),
        role: 'OWNER',
      })
      .mockResolvedValueOnce(null);

    await expect(
      mocks.sut.execute({ eventId, tenantId, userId, targetUserId }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ForbiddenError when trying to unshare the OWNER', async () => {
    mocks.calendarEventsRepository.findById.mockResolvedValue({
      id: new UniqueEntityID(eventId),
      calendarId: null,
    });
    mocks.eventParticipantsRepository.findByEventAndUser
      .mockResolvedValueOnce({
        id: new UniqueEntityID('p-owner'),
        role: 'OWNER',
      })
      .mockResolvedValueOnce({
        id: new UniqueEntityID('p-target'),
        role: 'OWNER',
      });

    await expect(
      mocks.sut.execute({ eventId, tenantId, userId, targetUserId }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should unshare event with calendar that has share permission', async () => {
    const calId = 'cal-1';
    mocks.calendarEventsRepository.findById.mockResolvedValue({
      id: new UniqueEntityID(eventId),
      calendarId: calId,
    });
    mocks.calendarsRepository.findById.mockResolvedValue({
      id: new UniqueEntityID(calId),
      type: 'PERSONAL',
      ownerId: userId,
      isPersonal: true,
      isTeam: false,
    });
    mocks.eventParticipantsRepository.findByEventAndUser.mockResolvedValueOnce({
      id: new UniqueEntityID('p-target'),
      role: 'GUEST',
    });
    mocks.eventParticipantsRepository.delete.mockResolvedValue(undefined);

    const result = await mocks.sut.execute({
      eventId,
      tenantId,
      userId,
      targetUserId,
    });

    expect(result.removed).toBe(true);
  });
});
