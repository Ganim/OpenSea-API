import { PrismaNotificationTemplatesRepository } from '@/repositories/notifications/prisma/prisma-notification-templates-repository';
import { PrismaNotificationsRepository } from '@/repositories/notifications/prisma/prisma-notifications-repository';
import { CreateFromTemplateUseCase } from '@/use-cases/notifications/create-from-template';

export function makeCreateFromTemplateUseCase() {
  const notificationsRepository = new PrismaNotificationsRepository();
  const templatesRepository = new PrismaNotificationTemplatesRepository();
  return new CreateFromTemplateUseCase(
    notificationsRepository,
    templatesRepository,
  );
}
