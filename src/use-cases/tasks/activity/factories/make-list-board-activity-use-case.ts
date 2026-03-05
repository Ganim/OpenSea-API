import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { ListBoardActivityUseCase } from '../list-board-activity';

export function makeListBoardActivityUseCase() {
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new ListBoardActivityUseCase(cardActivitiesRepository);
}
