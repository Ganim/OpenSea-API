import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import type {
  TeamCalendarConfigsRepository,
  TeamCalendarConfigData,
} from '@/repositories/calendar/team-calendar-configs-repository';

interface UpdateTeamCalendarPermissionsRequest {
  calendarId: string;
  teamId: string;
  teamRole: string;
  permissions: {
    ownerCanRead?: boolean;
    ownerCanCreate?: boolean;
    ownerCanEdit?: boolean;
    ownerCanDelete?: boolean;
    ownerCanShare?: boolean;
    ownerCanManage?: boolean;
    adminCanRead?: boolean;
    adminCanCreate?: boolean;
    adminCanEdit?: boolean;
    adminCanDelete?: boolean;
    adminCanShare?: boolean;
    adminCanManage?: boolean;
    memberCanRead?: boolean;
    memberCanCreate?: boolean;
    memberCanEdit?: boolean;
    memberCanDelete?: boolean;
    memberCanShare?: boolean;
    memberCanManage?: boolean;
  };
}

interface UpdateTeamCalendarPermissionsResponse {
  config: TeamCalendarConfigData;
}

export class UpdateTeamCalendarPermissionsUseCase {
  constructor(
    private teamCalendarConfigsRepository: TeamCalendarConfigsRepository,
  ) {}

  async execute(
    request: UpdateTeamCalendarPermissionsRequest,
  ): Promise<UpdateTeamCalendarPermissionsResponse> {
    const { calendarId, teamId, teamRole, permissions } = request;

    // Must be OWNER or ADMIN to modify permissions
    if (teamRole !== 'OWNER' && teamRole !== 'ADMIN') {
      throw new ForbiddenError();
    }

    // Verify canManage permission from config
    const config =
      await this.teamCalendarConfigsRepository.findByTeamAndCalendar(
        teamId,
        calendarId,
      );
    if (!config) {
      throw new ResourceNotFoundError();
    }

    const canManage =
      teamRole === 'OWNER' ? config.ownerCanManage : config.adminCanManage;
    if (!canManage) {
      throw new ForbiddenError();
    }

    // ADMIN can only change member permissions (not owner or admin)
    let filteredPermissions = permissions;
    if (teamRole === 'ADMIN') {
      filteredPermissions = {
        memberCanRead: permissions.memberCanRead,
        memberCanCreate: permissions.memberCanCreate,
        memberCanEdit: permissions.memberCanEdit,
        memberCanDelete: permissions.memberCanDelete,
        memberCanShare: permissions.memberCanShare,
        memberCanManage: permissions.memberCanManage,
      };
    }

    const updated = await this.teamCalendarConfigsRepository.update({
      teamId,
      calendarId,
      ...filteredPermissions,
    });

    if (!updated) throw new ResourceNotFoundError();

    return { config: updated };
  }
}
