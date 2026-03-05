import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { ListCardActivityUseCase } from '../list-card-activity';

export function makeListCardActivityUseCase() {
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new ListCardActivityUseCase(cardActivitiesRepository);
}
