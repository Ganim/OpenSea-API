import { PrismaNotificationsRepository } from '@/repositories/notifications/prisma/prisma-notifications-repository';
import { CreateNotificationUseCase } from '@/use-cases/notifications/create-notification';

export function makeCreateNotificationUseCase() {
  const notificationsRepository = new PrismaNotificationsRepository();
  return new CreateNotificationUseCase(notificationsRepository);
}
