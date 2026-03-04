import type { Calendar } from '@/entities/calendar/calendar';
import type { TeamCalendarConfigData } from '@/repositories/calendar/team-calendar-configs-repository';

export interface CalendarAccess {
  canRead: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
}

interface ResolveCalendarAccessParams {
  calendar: Calendar;
  userId: string;
  teamRole?: string | null; // 'OWNER' | 'ADMIN' | 'MEMBER'
  teamCalendarConfig?: TeamCalendarConfigData | null;
}

export function resolveCalendarAccess(
  params: ResolveCalendarAccessParams,
): CalendarAccess {
  const { calendar, userId, teamRole, teamCalendarConfig } = params;

  // PERSONAL: owner has full access
  if (calendar.isPersonal) {
    const isOwner = calendar.ownerId === userId;
    return {
      canRead: isOwner,
      canCreate: isOwner,
      canEdit: isOwner,
      canDelete: false, // Personal calendars can never be deleted
      canShare: isOwner,
    };
  }

  // TEAM: access based on team role + config
  if (calendar.isTeam) {
    if (!teamRole || !teamCalendarConfig) {
      return {
        canRead: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canShare: false,
      };
    }

    const config = teamCalendarConfig;

    switch (teamRole) {
      case 'OWNER':
        return {
          canRead: config.ownerCanRead,
          canCreate: config.ownerCanCreate,
          canEdit: config.ownerCanEdit,
          canDelete: config.ownerCanDelete,
          canShare: config.ownerCanShare,
        };
      case 'ADMIN':
        return {
          canRead: config.adminCanRead,
          canCreate: config.adminCanCreate,
          canEdit: config.adminCanEdit,
          canDelete: config.adminCanDelete,
          canShare: config.adminCanShare,
        };
      case 'MEMBER':
      default:
        return {
          canRead: config.memberCanRead,
          canCreate: config.memberCanCreate,
          canEdit: config.memberCanEdit,
          canDelete: config.memberCanDelete,
          canShare: config.memberCanShare,
        };
    }
  }

  // SYSTEM: read-only for everyone
  return {
    canRead: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canShare: false,
  };
}
