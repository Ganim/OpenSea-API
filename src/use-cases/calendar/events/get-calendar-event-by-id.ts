import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type CalendarEventDTO,
  calendarEventToDTO,
} from '@/mappers/calendar/calendar-event/calendar-event-to-dto';
import type { CalendarEventsRepository } from '@/repositories/calendar/calendar-events-repository';
import type { EventParticipantsRepository } from '@/repositories/calendar/event-participants-repository';

interface GetCalendarEventByIdRequest {
  id: string;
  tenantId: string;
  userId: string;
}

interface GetCalendarEventByIdResponse {
  event: CalendarEventDTO;
}

export class GetCalendarEventByIdUseCase {
  constructor(
    private calendarEventsRepository: CalendarEventsRepository,
    private eventParticipantsRepository: EventParticipantsRepository,
  ) {}

  async execute(
    request: GetCalendarEventByIdRequest,
  ): Promise<GetCalendarEventByIdResponse> {
    const result = await this.calendarEventsRepository.findByIdWithRelations(
      request.id,
      request.tenantId,
    );

    if (!result) {
      throw new ResourceNotFoundError('Event not found');
    }

    const { event, creatorName, participants, reminders } = result;

    // For private events, show limited info to non-creators and non-participants
    if (event.isPrivate && event.createdBy.toString() !== request.userId) {
      const isParticipant =
        participants.some((p) => p.userId === request.userId) ||
        !!(await this.eventParticipantsRepository.findByEventAndUser(
          event.id.toString(),
          request.userId,
        ));

      if (!isParticipant) {
        // Return a "busy" placeholder for private events
        const dto = calendarEventToDTO(event);
        return {
          event: {
            ...dto,
            title: 'Ocupado',
            description: null,
            location: null,
            participants: [],
            reminders: [],
            metadata: {},
          },
        };
      }
    }

    return {
      event: calendarEventToDTO(event, {
        creatorName,
        participants,
        reminders,
      }),
    };
  }
}
