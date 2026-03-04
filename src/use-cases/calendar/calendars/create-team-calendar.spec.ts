import { describe, it, expect, beforeEach } from 'vitest';
import { CreateTeamCalendarUseCase } from './create-team-calendar';
import { InMemoryCalendarsRepository } from '@/repositories/calendar/in-memory/in-memory-calendars-repository';
import { InMemoryTeamCalendarConfigsRepository } from '@/repositories/calendar/in-memory/in-memory-team-calendar-configs-repository';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';

let calendarsRepository: InMemoryCalendarsRepository;
let teamCalendarConfigsRepository: InMemoryTeamCalendarConfigsRepository;
let sut: CreateTeamCalendarUseCase;

describe('CreateTeamCalendarUseCase', () => {
  beforeEach(() => {
    calendarsRepository = new InMemoryCalendarsRepository();
    teamCalendarConfigsRepository = new InMemoryTeamCalendarConfigsRepository();
    sut = new CreateTeamCalendarUseCase(
      calendarsRepository,
      teamCalendarConfigsRepository,
    );
  });

  it('should create a team calendar with OWNER role', async () => {
    const { calendar } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      teamId: 'team-1',
      teamRole: 'OWNER',
      name: 'Team Sales Calendar',
    });

    expect(calendar.name).toBe('Team Sales Calendar');
    expect(calendar.type).toBe('TEAM');
    expect(calendarsRepository.items).toHaveLength(1);
    expect(teamCalendarConfigsRepository.items).toHaveLength(1);
  });

  it('should create a team calendar with ADMIN role', async () => {
    const { calendar } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      teamId: 'team-1',
      teamRole: 'ADMIN',
      name: 'Team Support',
    });

    expect(calendar.name).toBe('Team Support');
    expect(calendar.type).toBe('TEAM');
  });

  it('should reject MEMBER role from creating team calendars', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        teamId: 'team-1',
        teamRole: 'MEMBER',
        name: 'Team Calendar',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should create default TeamCalendarConfig with correct permissions', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      teamId: 'team-1',
      teamRole: 'OWNER',
      name: 'Team Calendar',
    });

    const config = teamCalendarConfigsRepository.items[0];
    expect(config.ownerCanRead).toBe(true);
    expect(config.ownerCanCreate).toBe(true);
    expect(config.ownerCanEdit).toBe(true);
    expect(config.ownerCanDelete).toBe(true);
    expect(config.ownerCanShare).toBe(true);
    expect(config.adminCanRead).toBe(true);
    expect(config.adminCanCreate).toBe(true);
    expect(config.adminCanEdit).toBe(true);
    expect(config.adminCanDelete).toBe(false);
    expect(config.adminCanShare).toBe(false);
    expect(config.memberCanRead).toBe(true);
    expect(config.memberCanCreate).toBe(false);
    expect(config.memberCanEdit).toBe(false);
    expect(config.memberCanDelete).toBe(false);
    expect(config.memberCanShare).toBe(false);
  });

  it('should accept optional description and color', async () => {
    const { calendar } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      teamId: 'team-1',
      teamRole: 'OWNER',
      name: 'Team Calendar',
      description: 'A team calendar',
      color: '#ff0000',
    });

    expect(calendar.description).toBe('A team calendar');
    expect(calendar.color).toBe('#ff0000');
  });
});
