import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CalendarEventsRepository } from '@/repositories/calendar/calendar-events-repository';
import type { EventParticipantsRepository } from '@/repositories/calendar/event-participants-repository';
import type { CalendarsRepository } from '@/repositories/calendar/calendars-repository';
import type { TeamCalendarConfigsRepository } from '@/repositories/calendar/team-calendar-configs-repository';
import { resolveCalendarAccess } from '@/use-cases/calendar/helpers/resolve-calendar-access';

interface TeamMemberInfo {
  userId: string;
}

interface ShareEventWithTeamRequest {
  eventId: string;
  tenantId: string;
  userId: string;
  teamRole?: string | null;
  teamId: string;
  teamMembers: TeamMemberInfo[];
}

interface ShareEventWithTeamResponse {
  shared: number;
}

export class ShareEventWithTeamUseCase {
  constructor(
    private calendarEventsRepository: CalendarEventsRepository,
    private eventParticipantsRepository: EventParticipantsRepository,
    private calendarsRepository: CalendarsRepository,
    private teamCalendarConfigsRepository: TeamCalendarConfigsRepository,
  ) {}

  async execute(
    request: ShareEventWithTeamRequest,
  ): Promise<ShareEventWithTeamResponse> {
    const {
      eventId,
      tenantId,
      userId,
      teamRole,
      teamId: _teamId,
      teamMembers,
    } = request;

    const event = await this.calendarEventsRepository.findById(
      eventId,
      tenantId,
    );
    if (!event) {
      throw new ResourceNotFoundError('Event not found');
    }

    // Resolve calendar access
    if (event.calendarId) {
      const calendar = await this.calendarsRepository.findById(
        event.calendarId,
        tenantId,
      );
      if (calendar) {
        let teamConfig = null;
        if (calendar.type === 'TEAM' && calendar.ownerId) {
          teamConfig =
            await this.teamCalendarConfigsRepository.findByTeamAndCalendar(
              calendar.ownerId,
              calendar.id.toString(),
            );
        }

        const access = resolveCalendarAccess({
          calendar,
          userId,
          teamRole,
          teamCalendarConfig: teamConfig,
        });

        if (!access.canShare) {
          throw new ForbiddenError();
        }
      } else {
        // Calendar ID set but not found — fallback to owner check
        const ownerParticipant =
          await this.eventParticipantsRepository.findByEventAndUser(
            eventId,
            userId,
          );
        if (!ownerParticipant || ownerParticipant.role !== 'OWNER') {
          throw new ForbiddenError();
        }
      }
    } else {
      // No calendar assigned — only event owner can share
      const ownerParticipant =
        await this.eventParticipantsRepository.findByEventAndUser(
          eventId,
          userId,
        );
      if (!ownerParticipant || ownerParticipant.role !== 'OWNER') {
        throw new ForbiddenError();
      }
    }

    let shared = 0;

    for (const member of teamMembers) {
      // Skip if already a participant
      const existing =
        await this.eventParticipantsRepository.findByEventAndUser(
          eventId,
          member.userId,
        );
      if (existing) continue;

      await this.eventParticipantsRepository.create({
        tenantId,
        eventId,
        userId: member.userId,
        role: 'GUEST',
        status: 'PENDING',
      });

      shared++;
    }

    return { shared };
  }
}
