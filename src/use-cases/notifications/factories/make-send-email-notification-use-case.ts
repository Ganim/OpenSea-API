import { PrismaNotificationsRepository } from '@/repositories/notifications/prisma/prisma-notifications-repository';
import { PrismaNotificationPreferencesRepository } from '@/repositories/sales/prisma/prisma-notification-preferences-repository';
import { EmailService } from '@/services/email-service';
import { SendEmailNotificationUseCase } from '@/use-cases/notifications/send-email-notification';

export function makeSendEmailNotificationUseCase() {
  const notificationsRepository = new PrismaNotificationsRepository();
  const preferencesRepository = new PrismaNotificationPreferencesRepository();
  const emailService = new EmailService();
  return new SendEmailNotificationUseCase(
    notificationsRepository,
    emailService,
    preferencesRepository,
  );
}
