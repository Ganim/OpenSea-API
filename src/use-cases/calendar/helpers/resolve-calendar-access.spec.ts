import { describe, it, expect } from 'vitest';
import { resolveCalendarAccess } from './resolve-calendar-access';
import { Calendar } from '@/entities/calendar/calendar';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TeamCalendarConfigData } from '@/repositories/calendar/team-calendar-configs-repository';

function makeCalendar(type: 'PERSONAL' | 'TEAM' | 'SYSTEM', ownerId?: string) {
  return Calendar.create({
    tenantId: new UniqueEntityID('tenant-1'),
    name: `${type} Calendar`,
    type,
    ownerId:
      ownerId ??
      (type === 'PERSONAL' ? 'user-1' : type === 'TEAM' ? 'team-1' : undefined),
    createdBy: new UniqueEntityID('user-1'),
  });
}

function makeTeamConfig(
  overrides?: Partial<TeamCalendarConfigData>,
): TeamCalendarConfigData {
  return {
    id: 'config-1',
    tenantId: 'tenant-1',
    teamId: 'team-1',
    calendarId: 'cal-1',
    ownerCanRead: true,
    ownerCanCreate: true,
    ownerCanEdit: true,
    ownerCanDelete: true,
    ownerCanShare: true,
    adminCanRead: true,
    adminCanCreate: true,
    adminCanEdit: true,
    adminCanDelete: false,
    adminCanShare: false,
    memberCanRead: true,
    memberCanCreate: false,
    memberCanEdit: false,
    memberCanDelete: false,
    memberCanShare: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('resolveCalendarAccess', () => {
  describe('PERSONAL calendar', () => {
    it('should grant full access to owner (except delete)', () => {
      const calendar = makeCalendar('PERSONAL', 'user-1');
      const access = resolveCalendarAccess({ calendar, userId: 'user-1' });

      expect(access.canRead).toBe(true);
      expect(access.canCreate).toBe(true);
      expect(access.canEdit).toBe(true);
      expect(access.canDelete).toBe(false);
      expect(access.canShare).toBe(true);
    });

    it('should deny all access to non-owner', () => {
      const calendar = makeCalendar('PERSONAL', 'user-1');
      const access = resolveCalendarAccess({ calendar, userId: 'user-2' });

      expect(access.canRead).toBe(false);
      expect(access.canCreate).toBe(false);
      expect(access.canEdit).toBe(false);
      expect(access.canDelete).toBe(false);
      expect(access.canShare).toBe(false);
    });
  });

  describe('TEAM calendar', () => {
    it('should grant OWNER permissions from config', () => {
      const calendar = makeCalendar('TEAM');
      const config = makeTeamConfig();
      const access = resolveCalendarAccess({
        calendar,
        userId: 'user-1',
        teamRole: 'OWNER',
        teamCalendarConfig: config,
      });

      expect(access.canRead).toBe(true);
      expect(access.canCreate).toBe(true);
      expect(access.canEdit).toBe(true);
      expect(access.canDelete).toBe(true);
      expect(access.canShare).toBe(true);
    });

    it('should grant ADMIN permissions from config', () => {
      const calendar = makeCalendar('TEAM');
      const config = makeTeamConfig();
      const access = resolveCalendarAccess({
        calendar,
        userId: 'user-1',
        teamRole: 'ADMIN',
        teamCalendarConfig: config,
      });

      expect(access.canRead).toBe(true);
      expect(access.canCreate).toBe(true);
      expect(access.canEdit).toBe(true);
      expect(access.canDelete).toBe(false);
      expect(access.canShare).toBe(false);
    });

    it('should grant MEMBER permissions from config', () => {
      const calendar = makeCalendar('TEAM');
      const config = makeTeamConfig();
      const access = resolveCalendarAccess({
        calendar,
        userId: 'user-1',
        teamRole: 'MEMBER',
        teamCalendarConfig: config,
      });

      expect(access.canRead).toBe(true);
      expect(access.canCreate).toBe(false);
      expect(access.canEdit).toBe(false);
      expect(access.canDelete).toBe(false);
      expect(access.canShare).toBe(false);
    });

    it('should deny all access without teamRole', () => {
      const calendar = makeCalendar('TEAM');
      const access = resolveCalendarAccess({ calendar, userId: 'user-1' });

      expect(access.canRead).toBe(false);
      expect(access.canCreate).toBe(false);
    });

    it('should deny all access without config', () => {
      const calendar = makeCalendar('TEAM');
      const access = resolveCalendarAccess({
        calendar,
        userId: 'user-1',
        teamRole: 'OWNER',
      });

      expect(access.canRead).toBe(false);
    });

    it('should respect custom config values', () => {
      const calendar = makeCalendar('TEAM');
      const config = makeTeamConfig({
        memberCanCreate: true,
        memberCanEdit: true,
      });
      const access = resolveCalendarAccess({
        calendar,
        userId: 'user-1',
        teamRole: 'MEMBER',
        teamCalendarConfig: config,
      });

      expect(access.canRead).toBe(true);
      expect(access.canCreate).toBe(true);
      expect(access.canEdit).toBe(true);
      expect(access.canDelete).toBe(false);
    });
  });

  describe('SYSTEM calendar', () => {
    it('should grant read-only access', () => {
      const calendar = makeCalendar('SYSTEM');
      const access = resolveCalendarAccess({ calendar, userId: 'user-1' });

      expect(access.canRead).toBe(true);
      expect(access.canCreate).toBe(false);
      expect(access.canEdit).toBe(false);
      expect(access.canDelete).toBe(false);
      expect(access.canShare).toBe(false);
    });
  });
});
