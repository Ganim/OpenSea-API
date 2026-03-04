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
    adminCanRead?: boolean;
    adminCanCreate?: boolean;
    adminCanEdit?: boolean;
    adminCanDelete?: boolean;
    adminCanShare?: boolean;
    memberCanRead?: boolean;
    memberCanCreate?: boolean;
    memberCanEdit?: boolean;
    memberCanDelete?: boolean;
    memberCanShare?: boolean;
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

    // Only team OWNER can modify permissions
    if (teamRole !== 'OWNER') {
      throw new ForbiddenError();
    }

    const existing =
      await this.teamCalendarConfigsRepository.findByTeamAndCalendar(
        teamId,
        calendarId,
      );
    if (!existing) {
      throw new ResourceNotFoundError();
    }

    const updated = await this.teamCalendarConfigsRepository.update({
      teamId,
      calendarId,
      ...permissions,
    });

    if (!updated) throw new ResourceNotFoundError();

    return { config: updated };
  }
}
