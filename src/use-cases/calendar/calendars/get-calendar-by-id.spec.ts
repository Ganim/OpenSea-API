import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Calendar } from '@/entities/calendar/calendar';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetCalendarByIdUseCase } from './get-calendar-by-id';

const tenantId = 'tenant-1';
const userId = 'user-1';
const calendarId = 'cal-1';

function makeCalendar(overrides?: Partial<{ type: string; ownerId: string }>) {
  return Calendar.create(
    {
      tenantId: new UniqueEntityID(tenantId),
      name: 'My Calendar',
      type: overrides?.type ?? 'PERSONAL',
      ownerId: overrides?.ownerId ?? userId,
      createdBy: new UniqueEntityID(userId),
    },
    new UniqueEntityID(calendarId),
  );
}

function makeMocks() {
  const calendarsRepository = { findById: vi.fn() } as unknown;
  const teamCalendarConfigsRepository = { findByCalendar: vi.fn() } as unknown;

  const sut = new GetCalendarByIdUseCase(
    calendarsRepository,
    teamCalendarConfigsRepository,
  );

  return { sut, calendarsRepository, teamCalendarConfigsRepository };
}

describe('GetCalendarByIdUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
  });

  it('should return a personal calendar for its owner', async () => {
    mocks.calendarsRepository.findById.mockResolvedValue(makeCalendar());

    const result = await mocks.sut.execute({
      calendarId,
      tenantId,
      userId,
    });

    expect(result.calendar).toBeDefined();
    expect(result.calendar.id).toBe(calendarId);
    expect(result.calendar.name).toBe('My Calendar');
  });

  it('should return a system calendar (read-only for everyone)', async () => {
    const systemCalendar = makeCalendar({
      type: 'SYSTEM',
      ownerId: undefined as unknown,
    });
    mocks.calendarsRepository.findById.mockResolvedValue(systemCalendar);

    const result = await mocks.sut.execute({
      calendarId,
      tenantId,
      userId,
    });

    expect(result.calendar).toBeDefined();
    expect(result.calendar.access.canRead).toBe(true);
    expect(result.calendar.access.canEdit).toBe(false);
  });

  it('should throw ResourceNotFoundError when calendar does not exist', async () => {
    mocks.calendarsRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.sut.execute({ calendarId, tenantId, userId }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw ForbiddenError when user cannot read personal calendar', async () => {
    const otherCalendar = makeCalendar({ ownerId: 'other-user' });
    mocks.calendarsRepository.findById.mockResolvedValue(otherCalendar);

    await expect(
      mocks.sut.execute({ calendarId, tenantId, userId }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw ForbiddenError for team calendar when user has no team role', async () => {
    const teamCalendar = makeCalendar({ type: 'TEAM', ownerId: 'team-1' });
    mocks.calendarsRepository.findById.mockResolvedValue(teamCalendar);
    mocks.teamCalendarConfigsRepository.findByCalendar.mockResolvedValue([]);

    await expect(
      mocks.sut.execute({ calendarId, tenantId, userId }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should return team calendar when user has matching team role config', async () => {
    const teamCalendar = makeCalendar({ type: 'TEAM', ownerId: 'team-1' });
    mocks.calendarsRepository.findById.mockResolvedValue(teamCalendar);

    const config = {
      id: 'cfg-1',
      tenantId,
      teamId: 'team-1',
      calendarId,
      memberCanRead: true,
      memberCanCreate: false,
      memberCanEdit: false,
      memberCanDelete: false,
      memberCanShare: false,
      memberCanManage: false,
      ownerCanRead: true,
      ownerCanCreate: true,
      ownerCanEdit: true,
      ownerCanDelete: true,
      ownerCanShare: true,
      ownerCanManage: true,
      adminCanRead: true,
      adminCanCreate: true,
      adminCanEdit: true,
      adminCanDelete: false,
      adminCanShare: true,
      adminCanManage: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mocks.teamCalendarConfigsRepository.findByCalendar.mockResolvedValue([
      config,
    ]);

    const result = await mocks.sut.execute({
      calendarId,
      tenantId,
      userId,
      teamRole: 'MEMBER',
    });

    expect(result.calendar).toBeDefined();
    expect(result.calendar.access.canRead).toBe(true);
    expect(result.calendar.access.canCreate).toBe(false);
  });
});
