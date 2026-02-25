import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CalendarEventsRepository } from '@/repositories/calendar/calendar-events-repository';
import type { EventParticipantsRepository } from '@/repositories/calendar/event-participants-repository';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';
import type { NotificationTemplatesRepository } from '@/repositories/notifications/notification-templates-repository';
import { CreateFromTemplateUseCase } from '@/use-cases/notifications/create-from-template';

interface InviteParticipantsRequest {
  eventId: string;
  tenantId: string;
  userId: string;
  userName?: string;
  participants: { userId: string; role?: string }[];
}

interface InviteParticipantsResponse {
  invited: number;
}

export class InviteParticipantsUseCase {
  constructor(
    private calendarEventsRepository: CalendarEventsRepository,
    private eventParticipantsRepository: EventParticipantsRepository,
    private notificationsRepository: NotificationsRepository,
    private notificationTemplatesRepository: NotificationTemplatesRepository,
  ) {}

  async execute(
    request: InviteParticipantsRequest,
  ): Promise<InviteParticipantsResponse> {
    const { eventId, tenantId, userId, userName, participants } = request;

    const event = await this.calendarEventsRepository.findById(eventId, tenantId);
    if (!event) {
      throw new ResourceNotFoundError('Event not found');
    }

    // Verify inviter is OWNER
    const inviter = await this.eventParticipantsRepository.findByEventAndUser(
      eventId,
      userId,
    );
    if (!inviter || inviter.role !== 'OWNER') {
      throw new BadRequestError('Only the event owner can invite participants');
    }

    let invited = 0;
    const createFromTemplate = new CreateFromTemplateUseCase(
      this.notificationsRepository,
      this.notificationTemplatesRepository,
    );

    for (const participant of participants) {
      // Skip if already a participant
      const existing = await this.eventParticipantsRepository.findByEventAndUser(
        eventId,
        participant.userId,
      );
      if (existing) continue;

      await this.eventParticipantsRepository.create({
        tenantId,
        eventId,
        userId: participant.userId,
        role: participant.role ?? 'GUEST',
        status: 'PENDING',
      });

      // Send IN_APP + EMAIL notifications
      try {
        const notificationData = {
          userId: participant.userId,
          variables: {
            inviterName: userName ?? 'Alguém',
            eventTitle: event.title,
          },
          actionUrl: `/calendar?eventId=${eventId}`,
          entityType: 'CALENDAR_EVENT',
          entityId: eventId,
        };

        await Promise.allSettled([
          createFromTemplate.execute({ ...notificationData, templateCode: 'calendar.event.invite' }),
          createFromTemplate.execute({ ...notificationData, templateCode: 'calendar.event.invite.email' }),
        ]);
      } catch {
        // Notification failure should not block the invite
      }

      invited++;
    }

    return { invited };
  }
}
