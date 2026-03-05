import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { CreateSubtaskUseCase } from '../create-subtask';

export function makeCreateSubtaskUseCase() {
  const cardsRepository = new PrismaCardsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new CreateSubtaskUseCase(cardsRepository, cardActivitiesRepository);
}
