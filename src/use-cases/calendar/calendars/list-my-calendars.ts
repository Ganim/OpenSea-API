import type { CalendarsRepository } from '@/repositories/calendar/calendars-repository';
import type { TeamCalendarConfigsRepository } from '@/repositories/calendar/team-calendar-configs-repository';
import {
  type CalendarDTO,
  calendarToDTO,
} from '@/mappers/calendar/calendar/calendar-to-dto';
import { resolveCalendarAccess } from '../helpers/resolve-calendar-access';

interface TeamMembership {
  teamId: string;
  role: string;
}

interface ListMyCalendarsRequest {
  tenantId: string;
  userId: string;
  teamMemberships: TeamMembership[];
}

interface ListMyCalendarsResponse {
  calendars: CalendarDTO[];
}

export class ListMyCalendarsUseCase {
  constructor(
    private calendarsRepository: CalendarsRepository,
    private teamCalendarConfigsRepository: TeamCalendarConfigsRepository,
  ) {}

  async execute(
    request: ListMyCalendarsRequest,
  ): Promise<ListMyCalendarsResponse> {
    const { tenantId, userId, teamMemberships } = request;

    const teamIds = teamMemberships.map((m) => m.teamId);
    const allCalendars = await this.calendarsRepository.listByUser(
      userId,
      tenantId,
      teamIds,
    );

    // Deduplicate personal calendars (keep oldest, soft-delete extras)
    const personalCalendars = allCalendars.filter(
      (c) => c.isPersonal && c.ownerId === userId,
    );
    const duplicateIds = new Set<string>();
    if (personalCalendars.length > 1) {
      const sorted = [...personalCalendars].sort(
        (a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0),
      );
      for (let i = 1; i < sorted.length; i++) {
        const dupId = sorted[i].id.toString();
        duplicateIds.add(dupId);
        this.calendarsRepository.softDelete(dupId, tenantId).catch(() => {});
      }
    }

    const calendars = allCalendars.filter(
      (c) => !duplicateIds.has(c.id.toString()),
    );

    // Build a map of teamId -> role for quick lookup
    const teamRoleMap = new Map(teamMemberships.map((m) => [m.teamId, m.role]));

    // Pre-fetch all team calendar configs for team calendars
    const teamCalendars = calendars.filter((c) => c.isTeam);
    const configMap = new Map<
      string,
      Awaited<
        ReturnType<
          typeof this.teamCalendarConfigsRepository.findByTeamAndCalendar
        >
      >
    >();

    for (const cal of teamCalendars) {
      if (cal.ownerId) {
        const config =
          await this.teamCalendarConfigsRepository.findByTeamAndCalendar(
            cal.ownerId,
            cal.id.toString(),
          );
        configMap.set(cal.id.toString(), config);
      }
    }

    const result: CalendarDTO[] = [];

    for (const calendar of calendars) {
      let access;

      if (calendar.isTeam && calendar.ownerId) {
        const teamRole = teamRoleMap.get(calendar.ownerId);
        const config = configMap.get(calendar.id.toString());
        access = resolveCalendarAccess({
          calendar,
          userId,
          teamRole,
          teamCalendarConfig: config,
        });
      } else {
        access = resolveCalendarAccess({ calendar, userId });
      }

      // Only include if user can read
      if (access.canRead) {
        result.push(calendarToDTO(calendar, access));
      }
    }

    return { calendars: result };
  }
}
