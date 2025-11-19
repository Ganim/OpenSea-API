import { PrismaNotificationsRepository } from '@/repositories/notifications/prisma/prisma-notifications-repository';
import { PrismaNotificationPreferencesRepository } from '@/repositories/sales/prisma/prisma-notification-preferences-repository';
import { EmailService } from '@/services/email-service';
import { ProcessScheduledNotificationsUseCase } from '@/use-cases/notifications/process-scheduled-notifications';

export function makeProcessScheduledNotificationsUseCase() {
  const notificationsRepository = new PrismaNotificationsRepository();
  const preferencesRepository = new PrismaNotificationPreferencesRepository();
  const emailService = new EmailService();
  return new ProcessScheduledNotificationsUseCase(
    notificationsRepository,
    emailService,
    preferencesRepository,
  );
}
