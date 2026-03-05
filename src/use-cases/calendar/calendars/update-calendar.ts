import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import type { CalendarsRepository } from '@/repositories/calendar/calendars-repository';
import type { TeamCalendarConfigsRepository } from '@/repositories/calendar/team-calendar-configs-repository';
import {
  type CalendarDTO,
  calendarToDTO,
} from '@/mappers/calendar/calendar/calendar-to-dto';
import { resolveCalendarAccess } from '../helpers/resolve-calendar-access';

interface UpdateCalendarRequest {
  calendarId: string;
  tenantId: string;
  userId: string;
  teamRole?: string | null;
  name?: string;
  description?: string | null;
  color?: string | null;
}

interface UpdateCalendarResponse {
  calendar: CalendarDTO;
}

export class UpdateCalendarUseCase {
  constructor(
    private calendarsRepository: CalendarsRepository,
    private teamCalendarConfigsRepository: TeamCalendarConfigsRepository,
  ) {}

  async execute(
    request: UpdateCalendarRequest,
  ): Promise<UpdateCalendarResponse> {
    const { calendarId, tenantId, userId, teamRole, name, description, color } =
      request;

    const calendar = await this.calendarsRepository.findById(
      calendarId,
      tenantId,
    );
    if (!calendar) {
      throw new ResourceNotFoundError();
    }

    if (calendar.isSystem) {
      throw new BadRequestError('System calendars cannot be edited');
    }

    let teamCalendarConfig = null;
    if (calendar.isTeam && calendar.ownerId) {
      teamCalendarConfig =
        await this.teamCalendarConfigsRepository.findByTeamAndCalendar(
          calendar.ownerId,
          calendarId,
        );
    }

    const access = resolveCalendarAccess({
      calendar,
      userId,
      teamRole,
      teamCalendarConfig,
    });
    if (!access.canManage) {
      throw new ForbiddenError();
    }

    const updated = await this.calendarsRepository.update({
      id: calendarId,
      tenantId,
      name: name?.trim(),
      description,
      color,
    });

    if (!updated) throw new ResourceNotFoundError();

    return { calendar: calendarToDTO(updated, access) };
  }
}
