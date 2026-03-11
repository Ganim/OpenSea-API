import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CalendarEventsRepository } from '@/repositories/calendar/calendar-events-repository';
import type { EventParticipantsRepository } from '@/repositories/calendar/event-participants-repository';
import type { CalendarsRepository } from '@/repositories/calendar/calendars-repository';
import type { TeamCalendarConfigsRepository } from '@/repositories/calendar/team-calendar-configs-repository';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';
import { resolveCalendarAccess } from '@/use-cases/calendar/helpers/resolve-calendar-access';

interface ShareEventWithUsersRequest {
  eventId: string;
  tenantId: string;
  userId: string;
  teamRole?: string | null;
  targetUserIds: string[];
}

interface ShareEventWithUsersResponse {
  shared: number;
}

export class ShareEventWithUsersUseCase {
  constructor(
    private calendarEventsRepository: CalendarEventsRepository,
    private eventParticipantsRepository: EventParticipantsRepository,
    private calendarsRepository: CalendarsRepository,
    private teamCalendarConfigsRepository: TeamCalendarConfigsRepository,
    private teamMembersRepository?: TeamMembersRepository,
  ) {}

  async execute(
    request: ShareEventWithUsersRequest,
  ): Promise<ShareEventWithUsersResponse> {
    const { eventId, tenantId, userId, teamRole, targetUserIds } = request;

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
        let resolvedTeamRole = teamRole ?? null;

        if (calendar.type === 'TEAM' && calendar.ownerId) {
          teamConfig =
            await this.teamCalendarConfigsRepository.findByTeamAndCalendar(
              calendar.ownerId,
              calendar.id.toString(),
            );

          // Auto-resolve team role if not provided and repository is available
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

    if (targetUserIds.length === 0) {
      throw new BadRequestError('At least one user is required');
    }

    let shared = 0;

    for (const targetUserId of targetUserIds) {
      // Skip if already a participant
      const existing =
        await this.eventParticipantsRepository.findByEventAndUser(
          eventId,
          targetUserId,
        );
      if (existing) continue;

      await this.eventParticipantsRepository.create({
        tenantId,
        eventId,
        userId: targetUserId,
        role: 'GUEST',
        status: 'PENDING',
      });

      shared++;
    }

    return { shared };
  }
}
