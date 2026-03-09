import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { ListCardActivityUseCase } from '../list-card-activity';

export function makeListCardActivityUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new ListCardActivityUseCase(boardsRepository, cardActivitiesRepository);
}
