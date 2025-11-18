import { PrismaNotificationsRepository } from '@/repositories/notifications/prisma/prisma-notifications-repository';
import { DeleteNotificationUseCase } from '@/use-cases/notifications/delete-notification';

export function makeDeleteNotificationUseCase() {
  const notificationsRepository = new PrismaNotificationsRepository();
  return new DeleteNotificationUseCase(notificationsRepository);
}
