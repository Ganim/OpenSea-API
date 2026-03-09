import { logger } from '@/lib/logger';
import type { EventRemindersRepository } from '@/repositories/calendar/event-reminders-repository';
import type { NotificationsRepository } from '@/repositories/notifications/notifications-repository';
import type { NotificationTemplatesRepository } from '@/repositories/notifications/notification-templates-repository';
import { CreateFromTemplateUseCase } from '@/use-cases/notifications/create-from-template';

interface ProcessDueRemindersRequest {
  now?: Date;
  batchSize?: number;
}

interface ProcessDueRemindersResponse {
  processed: number;
  errors: number;
}

export class ProcessDueRemindersUseCase {
  constructor(
    private eventRemindersRepository: EventRemindersRepository,
    private notificationsRepository: NotificationsRepository,
    private notificationTemplatesRepository: NotificationTemplatesRepository,
  ) {}

  async execute(
    request?: ProcessDueRemindersRequest,
  ): Promise<ProcessDueRemindersResponse> {
    const now = request?.now ?? new Date();
    let processed = 0;
    let errors = 0;

    const dueReminders =
      await this.eventRemindersRepository.findDueReminders(now);
    const batch = request?.batchSize
      ? dueReminders.slice(0, request.batchSize)
      : dueReminders;

    const createFromTemplate = new CreateFromTemplateUseCase(
      this.notificationsRepository,
      this.notificationTemplatesRepository,
    );

    for (const { reminder, eventTitle } of batch) {
      try {
        const eventId = reminder.eventId.toString();
        const userId = reminder.userId.toString();

        const notificationData = {
          userId,
          variables: {
            eventTitle,
            minutesBefore: reminder.minutesBefore,
          },
          entityType: 'CALENDAR_EVENT',
          entityId: eventId,
        };

        // Send IN_APP + EMAIL notifications
        const results = await Promise.allSettled([
          createFromTemplate.execute({
            ...notificationData,
            templateCode: 'calendar.event.reminder',
          }),
          createFromTemplate.execute({
            ...notificationData,
            templateCode: 'calendar.event.reminder.email',
          }),
        ]);

        const hasAnySuccess = results.some((r) => r.status === 'fulfilled');

        if (hasAnySuccess) {
          await this.eventRemindersRepository.markSent(reminder.id.toString());
          processed++;
        } else {
          logger.warn(
            { reminderId: reminder.id.toString(), eventTitle },
            'All notification channels failed for reminder, skipping markSent',
          );
          errors++;
        }
      } catch (err) {
        logger.error(
          { err, reminderId: reminder.id.toString() },
          'Failed to process reminder',
        );
        errors++;
      }
    }

    return { processed, errors };
  }
}
