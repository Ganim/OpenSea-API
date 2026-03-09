import { PrismaBoardMembersRepository } from '@/repositories/tasks/prisma/prisma-board-members-repository';
import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { UpdateCardUseCase } from '../update-card';

export function makeUpdateCardUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const cardsRepository = new PrismaCardsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  const boardMembersRepository = new PrismaBoardMembersRepository();
  return new UpdateCardUseCase(boardsRepository, cardsRepository, cardActivitiesRepository, boardMembersRepository);
}
