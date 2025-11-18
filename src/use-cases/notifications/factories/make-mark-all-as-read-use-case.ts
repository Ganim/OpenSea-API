import { PrismaNotificationsRepository } from '@/repositories/notifications/prisma/prisma-notifications-repository';
import { MarkAllAsReadUseCase } from '@/use-cases/notifications/mark-all-as-read';

export function makeMarkAllAsReadUseCase() {
  const notificationsRepository = new PrismaNotificationsRepository();
  return new MarkAllAsReadUseCase(notificationsRepository);
}
