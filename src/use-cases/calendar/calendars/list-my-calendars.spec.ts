import { describe, it, expect, beforeEach } from 'vitest';
import { ListMyCalendarsUseCase } from './list-my-calendars';
import { InMemoryCalendarsRepository } from '@/repositories/calendar/in-memory/in-memory-calendars-repository';
import { InMemoryTeamCalendarConfigsRepository } from '@/repositories/calendar/in-memory/in-memory-team-calendar-configs-repository';

let calendarsRepository: InMemoryCalendarsRepository;
let teamCalendarConfigsRepository: InMemoryTeamCalendarConfigsRepository;
let sut: ListMyCalendarsUseCase;

describe('ListMyCalendarsUseCase', () => {
  beforeEach(() => {
    calendarsRepository = new InMemoryCalendarsRepository();
    teamCalendarConfigsRepository = new InMemoryTeamCalendarConfigsRepository();
    sut = new ListMyCalendarsUseCase(
      calendarsRepository,
      teamCalendarConfigsRepository,
    );
  });

  it('should return personal calendar', async () => {
    await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Meu Calendário',
      type: 'PERSONAL',
      ownerId: 'user-1',
      isDefault: true,
      createdBy: 'user-1',
    });

    const { calendars } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      teamMemberships: [],
    });

    expect(calendars).toHaveLength(1);
    expect(calendars[0].type).toBe('PERSONAL');
    expect(calendars[0].access.canRead).toBe(true);
  });

  it('should return team calendars for team members', async () => {
    const calendar = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Team Sales',
      type: 'TEAM',
      ownerId: 'team-1',
      createdBy: 'user-1',
    });

    await teamCalendarConfigsRepository.create({
      tenantId: 'tenant-1',
      teamId: 'team-1',
      calendarId: calendar.id.toString(),
    });

    const { calendars } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      teamMemberships: [{ teamId: 'team-1', role: 'OWNER' }],
    });

    expect(calendars).toHaveLength(1);
    expect(calendars[0].type).toBe('TEAM');
    expect(calendars[0].access.canRead).toBe(true);
  });

  it('should return system calendars as read-only', async () => {
    await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'RH',
      type: 'SYSTEM',
      systemModule: 'HR',
      createdBy: 'system',
    });

    const { calendars } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      teamMemberships: [],
    });

    expect(calendars).toHaveLength(1);
    expect(calendars[0].type).toBe('SYSTEM');
    expect(calendars[0].access.canRead).toBe(true);
    expect(calendars[0].access.canCreate).toBe(false);
    expect(calendars[0].access.canEdit).toBe(false);
  });

  it('should not return team calendars user is not a member of', async () => {
    const calendar = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Team Support',
      type: 'TEAM',
      ownerId: 'team-2',
      createdBy: 'user-2',
    });

    await teamCalendarConfigsRepository.create({
      tenantId: 'tenant-1',
      teamId: 'team-2',
      calendarId: calendar.id.toString(),
    });

    const { calendars } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      teamMemberships: [{ teamId: 'team-1', role: 'MEMBER' }],
    });

    // No personal calendar, no team-1 calendars exist, team-2 not a member
    expect(calendars).toHaveLength(0);
  });

  it('should combine personal + team + system calendars', async () => {
    await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Meu Calendário',
      type: 'PERSONAL',
      ownerId: 'user-1',
      isDefault: true,
      createdBy: 'user-1',
    });

    const teamCal = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Team Sales',
      type: 'TEAM',
      ownerId: 'team-1',
      createdBy: 'user-1',
    });

    await teamCalendarConfigsRepository.create({
      tenantId: 'tenant-1',
      teamId: 'team-1',
      calendarId: teamCal.id.toString(),
    });

    await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Financeiro',
      type: 'SYSTEM',
      systemModule: 'FINANCE',
      createdBy: 'system',
    });

    const { calendars } = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      teamMemberships: [{ teamId: 'team-1', role: 'OWNER' }],
    });

    expect(calendars).toHaveLength(3);
    const types = calendars.map((c) => c.type);
    expect(types).toContain('PERSONAL');
    expect(types).toContain('TEAM');
    expect(types).toContain('SYSTEM');
  });
});
