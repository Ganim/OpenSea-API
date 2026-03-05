import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { UpdateSubtaskUseCase } from '../update-subtask';

export function makeUpdateSubtaskUseCase() {
  const cardsRepository = new PrismaCardsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new UpdateSubtaskUseCase(cardsRepository, cardActivitiesRepository);
}
