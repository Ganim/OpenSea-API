import { PrismaBoardAutomationsRepository } from '@/repositories/tasks/prisma/prisma-board-automations-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaBoardColumnsRepository } from '@/repositories/tasks/prisma/prisma-board-columns-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { ExecuteAutomationUseCase } from '../execute-automation';

export function makeExecuteAutomationUseCase() {
  const boardAutomationsRepository = new PrismaBoardAutomationsRepository();
  const cardsRepository = new PrismaCardsRepository();
  const boardColumnsRepository = new PrismaBoardColumnsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new ExecuteAutomationUseCase(
    boardAutomationsRepository,
    cardsRepository,
    boardColumnsRepository,
    cardActivitiesRepository,
  );
}
