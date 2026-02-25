import { PrismaCalendarEventsRepository } from '@/repositories/calendar/prisma/prisma-calendar-events-repository';
import { PrismaEventParticipantsRepository } from '@/repositories/calendar/prisma/prisma-event-participants-repository';
import { PrismaNotificationsRepository } from '@/repositories/notifications/prisma/prisma-notifications-repository';
import { PrismaNotificationTemplatesRepository } from '@/repositories/notifications/prisma/prisma-notification-templates-repository';
import { RespondToEventUseCase } from '../respond-to-event';

export function makeRespondToEventUseCase() {
  return new RespondToEventUseCase(
    new PrismaCalendarEventsRepository(),
    new PrismaEventParticipantsRepository(),
    new PrismaNotificationsRepository(),
    new PrismaNotificationTemplatesRepository(),
  );
}
