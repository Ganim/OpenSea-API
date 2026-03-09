import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { ListBoardActivityUseCase } from '../list-board-activity';

export function makeListBoardActivityUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new ListBoardActivityUseCase(boardsRepository, cardActivitiesRepository);
}
