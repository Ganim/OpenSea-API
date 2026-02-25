import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CalendarEventsRepository } from '@/repositories/calendar/calendar-events-repository';
import type { EventParticipantsRepository } from '@/repositories/calendar/event-participants-repository';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';
import type { NotificationTemplatesRepository } from '@/repositories/notifications/notification-templates-repository';
import { CreateFromTemplateUseCase } from '@/use-cases/notifications/create-from-template';

interface RemoveParticipantRequest {
  eventId: string;
  tenantId: string;
  userId: string;
  participantUserId: string;
}

interface RemoveParticipantResponse {
  removed: boolean;
}

export class RemoveParticipantUseCase {
  constructor(
    private calendarEventsRepository: CalendarEventsRepository,
    private eventParticipantsRepository: EventParticipantsRepository,
    private notificationsRepository: NotificationsRepository,
    private notificationTemplatesRepository: NotificationTemplatesRepository,
  ) {}

  async execute(
    request: RemoveParticipantRequest,
  ): Promise<RemoveParticipantResponse> {
    const { eventId, tenantId, userId, participantUserId } = request;

    const event = await this.calendarEventsRepository.findById(eventId, tenantId);
    if (!event) {
      throw new ResourceNotFoundError('Event not found');
    }

    // Verify requester is OWNER
    const requester = await this.eventParticipantsRepository.findByEventAndUser(
      eventId,
      userId,
    );
    if (!requester || requester.role !== 'OWNER') {
      throw new BadRequestError('Only the event owner can remove participants');
    }

    // Find target participant
    const target = await this.eventParticipantsRepository.findByEventAndUser(
      eventId,
      participantUserId,
    );
    if (!target) {
      throw new ResourceNotFoundError('Participant not found');
    }

    if (target.role === 'OWNER') {
      throw new BadRequestError('Cannot remove the event owner');
    }

    await this.eventParticipantsRepository.delete(target.id.toString());

    // Notify removed participant (IN_APP + EMAIL)
    try {
      const createFromTemplate = new CreateFromTemplateUseCase(
        this.notificationsRepository,
        this.notificationTemplatesRepository,
      );

      const notificationData = {
        userId: participantUserId,
        variables: {
          eventTitle: event.title,
        },
        entityType: 'CALENDAR_EVENT',
        entityId: eventId,
      };

      await Promise.allSettled([
        createFromTemplate.execute({ ...notificationData, templateCode: 'calendar.event.removed' }),
        createFromTemplate.execute({ ...notificationData, templateCode: 'calendar.event.removed.email' }),
      ]);
    } catch {
      // Notification failure should not block the removal
    }

    return { removed: true };
  }
}
