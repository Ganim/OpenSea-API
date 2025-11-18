import { PrismaNotificationsRepository } from '@/repositories/notifications/prisma/prisma-notifications-repository';
import { ListNotificationsByUserIdUseCase } from '@/use-cases/notifications/list-notifications';

function makeListNotificationsByUserIdUseCase() {
  const notificationsRepository = new PrismaNotificationsRepository();
  return new ListNotificationsByUserIdUseCase(notificationsRepository);
}

export { makeListNotificationsByUserIdUseCase };
