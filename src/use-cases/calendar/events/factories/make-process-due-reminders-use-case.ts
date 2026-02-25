import { PrismaEventRemindersRepository } from '@/repositories/calendar/prisma/prisma-event-reminders-repository';
import { PrismaNotificationsRepository } from '@/repositories/notifications/prisma/prisma-notifications-repository';
import { PrismaNotificationTemplatesRepository } from '@/repositories/notifications/prisma/prisma-notification-templates-repository';
import { ProcessDueRemindersUseCase } from '../process-due-reminders';

export function makeProcessDueRemindersUseCase() {
  return new ProcessDueRemindersUseCase(
    new PrismaEventRemindersRepository(),
    new PrismaNotificationsRepository(),
    new PrismaNotificationTemplatesRepository(),
  );
}
