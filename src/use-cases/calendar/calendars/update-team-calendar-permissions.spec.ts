import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateTeamCalendarPermissionsUseCase } from './update-team-calendar-permissions';
import { InMemoryTeamCalendarConfigsRepository } from '@/repositories/calendar/in-memory/in-memory-team-calendar-configs-repository';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';

let teamCalendarConfigsRepository: InMemoryTeamCalendarConfigsRepository;
let sut: UpdateTeamCalendarPermissionsUseCase;

describe('UpdateTeamCalendarPermissionsUseCase', () => {
  beforeEach(() => {
    teamCalendarConfigsRepository = new InMemoryTeamCalendarConfigsRepository();
    sut = new UpdateTeamCalendarPermissionsUseCase(
      teamCalendarConfigsRepository,
    );
  });

  async function createConfig(
    overrides?: Partial<
      Parameters<typeof teamCalendarConfigsRepository.create>[0]
    >,
  ) {
    return teamCalendarConfigsRepository.create({
      tenantId: 'tenant-1',
      teamId: 'team-1',
      calendarId: 'cal-1',
      ownerCanManage: true,
      adminCanManage: false,
      ...overrides,
    });
  }

  it('should allow OWNER with canManage to update all permissions', async () => {
    await createConfig();

    const { config } = await sut.execute({
      calendarId: 'cal-1',
      teamId: 'team-1',
      teamRole: 'OWNER',
      permissions: {
        adminCanCreate: false,
        memberCanRead: false,
      },
    });

    expect(config.adminCanCreate).toBe(false);
    expect(config.memberCanRead).toBe(false);
  });

  it('should reject OWNER without canManage', async () => {
    await createConfig({ ownerCanManage: false });

    await expect(
      sut.execute({
        calendarId: 'cal-1',
        teamId: 'team-1',
        teamRole: 'OWNER',
        permissions: { memberCanRead: false },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should allow ADMIN with canManage to update member permissions only', async () => {
    await createConfig({ adminCanManage: true });

    const { config } = await sut.execute({
      calendarId: 'cal-1',
      teamId: 'team-1',
      teamRole: 'ADMIN',
      permissions: {
        ownerCanRead: false,
        adminCanCreate: false,
        memberCanCreate: true,
        memberCanEdit: true,
      },
    });

    // ADMIN changes to member* should apply
    expect(config.memberCanCreate).toBe(true);
    expect(config.memberCanEdit).toBe(true);

    // ADMIN changes to owner* and admin* should be filtered out
    expect(config.ownerCanRead).toBe(true);
    expect(config.adminCanCreate).toBe(true);
  });

  it('should reject ADMIN without canManage', async () => {
    await createConfig({ adminCanManage: false });

    await expect(
      sut.execute({
        calendarId: 'cal-1',
        teamId: 'team-1',
        teamRole: 'ADMIN',
        permissions: { memberCanRead: false },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should reject MEMBER from updating permissions', async () => {
    await createConfig();

    await expect(
      sut.execute({
        calendarId: 'cal-1',
        teamId: 'team-1',
        teamRole: 'MEMBER',
        permissions: { memberCanRead: false },
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw ResourceNotFoundError when config does not exist', async () => {
    await expect(
      sut.execute({
        calendarId: 'non-existent',
        teamId: 'team-1',
        teamRole: 'OWNER',
        permissions: {},
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should allow ADMIN to update memberCanManage', async () => {
    await createConfig({ adminCanManage: true });

    const { config } = await sut.execute({
      calendarId: 'cal-1',
      teamId: 'team-1',
      teamRole: 'ADMIN',
      permissions: {
        memberCanManage: true,
      },
    });

    expect(config.memberCanManage).toBe(true);
  });

  it('should allow OWNER to update canManage for all roles', async () => {
    await createConfig();

    const { config } = await sut.execute({
      calendarId: 'cal-1',
      teamId: 'team-1',
      teamRole: 'OWNER',
      permissions: {
        ownerCanManage: true,
        adminCanManage: true,
        memberCanManage: true,
      },
    });

    expect(config.ownerCanManage).toBe(true);
    expect(config.adminCanManage).toBe(true);
    expect(config.memberCanManage).toBe(true);
  });
});
