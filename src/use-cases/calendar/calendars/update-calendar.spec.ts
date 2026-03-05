import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateCalendarUseCase } from './update-calendar';
import { InMemoryCalendarsRepository } from '@/repositories/calendar/in-memory/in-memory-calendars-repository';
import { InMemoryTeamCalendarConfigsRepository } from '@/repositories/calendar/in-memory/in-memory-team-calendar-configs-repository';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

let calendarsRepository: InMemoryCalendarsRepository;
let teamCalendarConfigsRepository: InMemoryTeamCalendarConfigsRepository;
let sut: UpdateCalendarUseCase;

describe('UpdateCalendarUseCase', () => {
  beforeEach(() => {
    calendarsRepository = new InMemoryCalendarsRepository();
    teamCalendarConfigsRepository = new InMemoryTeamCalendarConfigsRepository();
    sut = new UpdateCalendarUseCase(
      calendarsRepository,
      teamCalendarConfigsRepository,
    );
  });

  it('should update a personal calendar by its owner', async () => {
    const created = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'My Calendar',
      type: 'PERSONAL',
      ownerId: 'user-1',
      isDefault: true,
      settings: {},
      createdBy: 'user-1',
    });

    const { calendar } = await sut.execute({
      calendarId: created.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
      name: 'Renamed Calendar',
      color: '#ff0000',
    });

    expect(calendar.name).toBe('Renamed Calendar');
    expect(calendar.color).toBe('#ff0000');
  });

  it('should reject update by non-owner of personal calendar', async () => {
    const created = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'My Calendar',
      type: 'PERSONAL',
      ownerId: 'user-1',
      isDefault: true,
      settings: {},
      createdBy: 'user-1',
    });

    await expect(
      sut.execute({
        calendarId: created.id.toString(),
        tenantId: 'tenant-1',
        userId: 'user-2',
        name: 'Hacked',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should update a team calendar when OWNER has canManage', async () => {
    const created = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Team Calendar',
      type: 'TEAM',
      ownerId: 'team-1',
      isDefault: false,
      settings: {},
      createdBy: 'user-1',
    });

    await teamCalendarConfigsRepository.create({
      tenantId: 'tenant-1',
      teamId: 'team-1',
      calendarId: created.id.toString(),
      ownerCanManage: true,
    });

    const { calendar } = await sut.execute({
      calendarId: created.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
      teamRole: 'OWNER',
      name: 'Updated Team Calendar',
    });

    expect(calendar.name).toBe('Updated Team Calendar');
  });

  it('should reject team calendar update when OWNER lacks canManage', async () => {
    const created = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Team Calendar',
      type: 'TEAM',
      ownerId: 'team-1',
      isDefault: false,
      settings: {},
      createdBy: 'user-1',
    });

    await teamCalendarConfigsRepository.create({
      tenantId: 'tenant-1',
      teamId: 'team-1',
      calendarId: created.id.toString(),
      ownerCanManage: false,
    });

    await expect(
      sut.execute({
        calendarId: created.id.toString(),
        tenantId: 'tenant-1',
        userId: 'user-1',
        teamRole: 'OWNER',
        name: 'Should Fail',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should reject team calendar update when ADMIN lacks canManage', async () => {
    const created = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Team Calendar',
      type: 'TEAM',
      ownerId: 'team-1',
      isDefault: false,
      settings: {},
      createdBy: 'user-1',
    });

    await teamCalendarConfigsRepository.create({
      tenantId: 'tenant-1',
      teamId: 'team-1',
      calendarId: created.id.toString(),
      adminCanManage: false,
    });

    await expect(
      sut.execute({
        calendarId: created.id.toString(),
        tenantId: 'tenant-1',
        userId: 'user-1',
        teamRole: 'ADMIN',
        name: 'Should Fail',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should allow ADMIN with canManage to update team calendar', async () => {
    const created = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Team Calendar',
      type: 'TEAM',
      ownerId: 'team-1',
      isDefault: false,
      settings: {},
      createdBy: 'user-1',
    });

    await teamCalendarConfigsRepository.create({
      tenantId: 'tenant-1',
      teamId: 'team-1',
      calendarId: created.id.toString(),
      adminCanManage: true,
    });

    const { calendar } = await sut.execute({
      calendarId: created.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
      teamRole: 'ADMIN',
      name: 'Admin Updated',
    });

    expect(calendar.name).toBe('Admin Updated');
  });

  it('should reject MEMBER without canManage from updating team calendar', async () => {
    const created = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Team Calendar',
      type: 'TEAM',
      ownerId: 'team-1',
      isDefault: false,
      settings: {},
      createdBy: 'user-1',
    });

    await teamCalendarConfigsRepository.create({
      tenantId: 'tenant-1',
      teamId: 'team-1',
      calendarId: created.id.toString(),
      memberCanManage: false,
    });

    await expect(
      sut.execute({
        calendarId: created.id.toString(),
        tenantId: 'tenant-1',
        userId: 'user-1',
        teamRole: 'MEMBER',
        name: 'Should Fail',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should allow MEMBER with canManage to update team calendar', async () => {
    const created = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'Team Calendar',
      type: 'TEAM',
      ownerId: 'team-1',
      isDefault: false,
      settings: {},
      createdBy: 'user-1',
    });

    await teamCalendarConfigsRepository.create({
      tenantId: 'tenant-1',
      teamId: 'team-1',
      calendarId: created.id.toString(),
      memberCanManage: true,
    });

    const { calendar } = await sut.execute({
      calendarId: created.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
      teamRole: 'MEMBER',
      name: 'Member Updated',
    });

    expect(calendar.name).toBe('Member Updated');
  });

  it('should reject editing a system calendar', async () => {
    const created = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'System Calendar',
      type: 'SYSTEM',
      systemModule: 'HR',
      isDefault: false,
      settings: {},
      createdBy: 'user-1',
    });

    await expect(
      sut.execute({
        calendarId: created.id.toString(),
        tenantId: 'tenant-1',
        userId: 'user-1',
        name: 'Hacked',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ResourceNotFoundError for non-existent calendar', async () => {
    await expect(
      sut.execute({
        calendarId: 'non-existent',
        tenantId: 'tenant-1',
        userId: 'user-1',
        name: 'Test',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should trim the name when updating', async () => {
    const created = await calendarsRepository.create({
      tenantId: 'tenant-1',
      name: 'My Calendar',
      type: 'PERSONAL',
      ownerId: 'user-1',
      isDefault: true,
      settings: {},
      createdBy: 'user-1',
    });

    const { calendar } = await sut.execute({
      calendarId: created.id.toString(),
      tenantId: 'tenant-1',
      userId: 'user-1',
      name: '  Trimmed Name  ',
    });

    expect(calendar.name).toBe('Trimmed Name');
  });
});
