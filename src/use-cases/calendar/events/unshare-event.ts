import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CalendarEventsRepository } from '@/repositories/calendar/calendar-events-repository';
import type { EventParticipantsRepository } from '@/repositories/calendar/event-participants-repository';
import type { CalendarsRepository } from '@/repositories/calendar/calendars-repository';
import type { TeamCalendarConfigsRepository } from '@/repositories/calendar/team-calendar-configs-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';
import { resolveCalendarAccess } from '@/use-cases/calendar/helpers/resolve-calendar-access';

interface UnshareEventRequest {
  eventId: string;
  tenantId: string;
  userId: string;
  teamRole?: string | null;
  targetUserId: string;
}

interface UnshareEventResponse {
  removed: boolean;
}

export class UnshareEventUseCase {
  constructor(
    private calendarEventsRepository: CalendarEventsRepository,
    private eventParticipantsRepository: EventParticipantsRepository,
    private calendarsRepository: CalendarsRepository,
    private teamCalendarConfigsRepository: TeamCalendarConfigsRepository,
    private teamMembersRepository?: TeamMembersRepository,
  ) {}

  async execute(request: UnshareEventRequest): Promise<UnshareEventResponse> {
    const { eventId, tenantId, userId, teamRole, targetUserId } = request;

    const event = await this.calendarEventsRepository.findById(
      eventId,
      tenantId,
    );
    if (!event) {
      throw new ResourceNotFoundError('Evento');
    }

    // Resolve access: must have canShare permission
    if (event.calendarId) {
      const calendar = await this.calendarsRepository.findById(
        event.calendarId,
        tenantId,
      );
      if (calendar) {
        let teamConfig = null;
        let resolvedTeamRole = teamRole ?? null;

        if (calendar.type === 'TEAM' && calendar.ownerId) {
          teamConfig =
            await this.teamCalendarConfigsRepository.findByTeamAndCalendar(
              calendar.ownerId,
              calendar.id.toString(),
            );

          if (!resolvedTeamRole && this.teamMembersRepository) {
            const membership =
              await this.teamMembersRepository.findByTeamAndUser(
                new UniqueEntityID(calendar.ownerId),
                new UniqueEntityID(userId),
              );
            resolvedTeamRole = membership?.role ?? null;
          }
        }

        const access = resolveCalendarAccess({
          calendar,
          userId,
          teamRole: resolvedTeamRole,
          teamCalendarConfig: teamConfig,
        });

        if (!access.canShare) {
          throw new ForbiddenError();
        }
      } else {
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
      // No calendar — only event owner can unshare
      const ownerParticipant =
        await this.eventParticipantsRepository.findByEventAndUser(
          eventId,
          userId,
        );
      if (!ownerParticipant || ownerParticipant.role !== 'OWNER') {
        throw new ForbiddenError();
      }
    }

    // Find the participant to remove (only GUEST participants can be unshared)
    const participant =
      await this.eventParticipantsRepository.findByEventAndUser(
        eventId,
        targetUserId,
      );

    if (!participant) {
      throw new ResourceNotFoundError('Participante');
    }

    if (participant.role === 'OWNER') {
      throw new ForbiddenError();
    }

    await this.eventParticipantsRepository.delete(participant.id.toString());

    return { removed: true };
  }
}
