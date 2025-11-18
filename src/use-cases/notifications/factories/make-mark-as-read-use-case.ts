import { PrismaNotificationsRepository } from '@/repositories/notifications/prisma/prisma-notifications-repository';
import { MarkAsReadUseCase } from '@/use-cases/notifications/mark-as-read';

export function makeMarkAsReadUseCase() {
  const notificationsRepository = new PrismaNotificationsRepository();
  return new MarkAsReadUseCase(notificationsRepository);
}
