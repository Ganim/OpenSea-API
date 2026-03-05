import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaBoardLabelsRepository } from '@/repositories/tasks/prisma/prisma-board-labels-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { ManageCardLabelsUseCase } from '../manage-card-labels';

export function makeManageCardLabelsUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const cardsRepository = new PrismaCardsRepository();
  const boardLabelsRepository = new PrismaBoardLabelsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new ManageCardLabelsUseCase(
    boardsRepository,
    cardsRepository,
    boardLabelsRepository,
    cardActivitiesRepository,
  );
}
