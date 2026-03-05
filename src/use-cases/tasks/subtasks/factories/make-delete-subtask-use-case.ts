import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { DeleteSubtaskUseCase } from '../delete-subtask';

export function makeDeleteSubtaskUseCase() {
  const cardsRepository = new PrismaCardsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new DeleteSubtaskUseCase(cardsRepository, cardActivitiesRepository);
}
