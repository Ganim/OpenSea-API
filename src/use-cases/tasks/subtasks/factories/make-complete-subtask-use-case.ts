import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { CompleteSubtaskUseCase } from '../complete-subtask';

export function makeCompleteSubtaskUseCase() {
  const cardsRepository = new PrismaCardsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new CompleteSubtaskUseCase(cardsRepository, cardActivitiesRepository);
}
