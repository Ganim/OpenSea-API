import { PrismaNotificationsRepository } from '@/repositories/notifications/prisma/prisma-notifications-repository';
import { PrismaBoardAutomationsRepository } from '@/repositories/tasks/prisma/prisma-board-automations-repository';
import { PrismaBoardColumnsRepository } from '@/repositories/tasks/prisma/prisma-board-columns-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { PrismaCardWatchersRepository } from '@/repositories/tasks/prisma/prisma-card-watchers-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { ExecuteAutomationUseCase } from '../execute-automation';

export function makeExecuteAutomationUseCase() {
  const boardAutomationsRepository = new PrismaBoardAutomationsRepository();
  const cardsRepository = new PrismaCardsRepository();
  const boardColumnsRepository = new PrismaBoardColumnsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  const cardWatchersRepository = new PrismaCardWatchersRepository();
  const notificationsRepository = new PrismaNotificationsRepository();
  return new ExecuteAutomationUseCase(
    boardAutomationsRepository,
    cardsRepository,
    boardColumnsRepository,
    cardActivitiesRepository,
    cardWatchersRepository,
    notificationsRepository,
  );
}
