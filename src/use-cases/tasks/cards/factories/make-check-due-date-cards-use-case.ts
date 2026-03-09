import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaNotificationsRepository } from '@/repositories/notifications/prisma/prisma-notifications-repository';
import { CheckDueDateCardsUseCase } from '../check-due-date-cards';

export function makeCheckDueDateCardsUseCase() {
  const cardsRepository = new PrismaCardsRepository();
  const notificationsRepository = new PrismaNotificationsRepository();
  return new CheckDueDateCardsUseCase(cardsRepository, notificationsRepository);
}
