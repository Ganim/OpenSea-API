import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import type { CalendarsRepository } from '@/repositories/calendar/calendars-repository';
import type { TeamCalendarConfigsRepository } from '@/repositories/calendar/team-calendar-configs-repository';
import {
  type CalendarDTO,
  calendarToDTO,
} from '@/mappers/calendar/calendar/calendar-to-dto';
import { resolveCalendarAccess } from '../helpers/resolve-calendar-access';

interface CreateTeamCalendarRequest {
  tenantId: string;
  userId: string;
  teamId: string;
  teamRole: string; // Must be OWNER or ADMIN
  name: string;
  description?: string | null;
  color?: string | null;
}

interface CreateTeamCalendarResponse {
  calendar: CalendarDTO;
}

export class CreateTeamCalendarUseCase {
  constructor(
    private calendarsRepository: CalendarsRepository,
    private teamCalendarConfigsRepository: TeamCalendarConfigsRepository,
  ) {}

  async execute(
    request: CreateTeamCalendarRequest,
  ): Promise<CreateTeamCalendarResponse> {
    const { tenantId, userId, teamId, teamRole, name, description, color } =
      request;

    if (teamRole !== 'OWNER' && teamRole !== 'ADMIN') {
      throw new ForbiddenError();
    }

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Calendar name is required');
    }

    const calendar = await this.calendarsRepository.create({
      tenantId,
      name: name.trim(),
      description,
      color,
      type: 'TEAM',
      ownerId: teamId,
      createdBy: userId,
    });

    // Create default team config
    await this.teamCalendarConfigsRepository.create({
      tenantId,
      teamId,
      calendarId: calendar.id.toString(),
    });

    const access = resolveCalendarAccess({
      calendar,
      userId,
      teamRole,
      teamCalendarConfig: {
        id: '',
        tenantId,
        teamId,
        calendarId: calendar.id.toString(),
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
        adminCanShare: false,
        adminCanManage: false,
        memberCanRead: true,
        memberCanCreate: false,
        memberCanEdit: false,
        memberCanDelete: false,
        memberCanShare: false,
        memberCanManage: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { calendar: calendarToDTO(calendar, access) };
  }
}
