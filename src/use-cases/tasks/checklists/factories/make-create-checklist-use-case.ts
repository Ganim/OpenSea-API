import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaCardChecklistsRepository } from '@/repositories/tasks/prisma/prisma-card-checklists-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { CreateChecklistUseCase } from '../create-checklist';

export function makeCreateChecklistUseCase() {
  const cardsRepository = new PrismaCardsRepository();
  const cardChecklistsRepository = new PrismaCardChecklistsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new CreateChecklistUseCase(
    cardsRepository,
    cardChecklistsRepository,
    cardActivitiesRepository,
  );
}
