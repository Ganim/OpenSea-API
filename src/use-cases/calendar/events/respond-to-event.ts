import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CalendarEventsRepository } from '@/repositories/calendar/calendar-events-repository';
import type { EventParticipantsRepository } from '@/repositories/calendar/event-participants-repository';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';
import type { NotificationTemplatesRepository } from '@/repositories/notifications/notification-templates-repository';
import { CreateFromTemplateUseCase } from '@/use-cases/notifications/create-from-template';

interface RespondToEventRequest {
  eventId: string;
  tenantId: string;
  userId: string;
  userName?: string;
  status: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE';
}

interface RespondToEventResponse {
  participantId: string;
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: 'aceitou',
  DECLINED: 'recusou',
  TENTATIVE: 'respondeu talvez para',
};

export class RespondToEventUseCase {
  constructor(
    private calendarEventsRepository: CalendarEventsRepository,
    private eventParticipantsRepository: EventParticipantsRepository,
    private notificationsRepository: NotificationsRepository,
    private notificationTemplatesRepository: NotificationTemplatesRepository,
  ) {}

  async execute(
    request: RespondToEventRequest,
  ): Promise<RespondToEventResponse> {
    const { eventId, tenantId, userId, userName, status } = request;

    const event = await this.calendarEventsRepository.findById(
      eventId,
      tenantId,
    );
    if (!event) {
      throw new ResourceNotFoundError('Event not found');
    }

    const participant =
      await this.eventParticipantsRepository.findByEventAndUser(
        eventId,
        userId,
      );
    if (!participant) {
      throw new ResourceNotFoundError(
        'You are not a participant of this event',
      );
    }

    if (participant.role === 'OWNER') {
      throw new BadRequestError(
        'Event owner cannot respond to their own event',
      );
    }

    const updated = await this.eventParticipantsRepository.updateStatus(
      participant.id.toString(),
      status,
    );

    // Notify event creator (IN_APP + EMAIL)
    try {
      const createFromTemplate = new CreateFromTemplateUseCase(
        this.notificationsRepository,
        this.notificationTemplatesRepository,
      );

      const notificationData = {
        userId: event.createdBy.toString(),
        variables: {
          participantName: userName ?? 'Alguém',
          status: STATUS_LABELS[status] ?? status,
          eventTitle: event.title,
        },
        actionUrl: `/calendar?eventId=${eventId}`,
        entityType: 'CALENDAR_EVENT',
        entityId: eventId,
      };

      await Promise.allSettled([
        createFromTemplate.execute({
          ...notificationData,
          templateCode: 'calendar.event.rsvp',
        }),
        createFromTemplate.execute({
          ...notificationData,
          templateCode: 'calendar.event.rsvp.email',
        }),
      ]);
    } catch {
      // Notification failure should not block the response
    }

    return {
      participantId: updated?.id.toString() ?? participant.id.toString(),
      status,
    };
  }
}
