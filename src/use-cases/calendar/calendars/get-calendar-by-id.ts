import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import type { CalendarsRepository } from '@/repositories/calendar/calendars-repository';
import type { TeamCalendarConfigsRepository } from '@/repositories/calendar/team-calendar-configs-repository';
import {
  type CalendarDTO,
  calendarToDTO,
} from '@/mappers/calendar/calendar/calendar-to-dto';
import { resolveCalendarAccess } from '../helpers/resolve-calendar-access';

interface GetCalendarByIdRequest {
  calendarId: string;
  tenantId: string;
  userId: string;
  teamRole?: string | null;
}

interface GetCalendarByIdResponse {
  calendar: CalendarDTO;
}

export class GetCalendarByIdUseCase {
  constructor(
    private calendarsRepository: CalendarsRepository,
    private teamCalendarConfigsRepository: TeamCalendarConfigsRepository,
  ) {}

  async execute(
    request: GetCalendarByIdRequest,
  ): Promise<GetCalendarByIdResponse> {
    const { calendarId, tenantId, userId, teamRole } = request;

    const calendar = await this.calendarsRepository.findById(
      calendarId,
      tenantId,
    );
    if (!calendar) {
      throw new ResourceNotFoundError('Calendário');
    }

    let teamCalendarConfig = null;
    if (calendar.isTeam) {
      teamCalendarConfig = await this.teamCalendarConfigsRepository
        .findByCalendar(calendarId)
        .then((configs) => configs[0] ?? null);
    }

    const access = resolveCalendarAccess({
      calendar,
      userId,
      teamRole,
      teamCalendarConfig,
    });

    if (!access.canRead) {
      throw new ForbiddenError();
    }

    return { calendar: calendarToDTO(calendar, access) };
  }
}
