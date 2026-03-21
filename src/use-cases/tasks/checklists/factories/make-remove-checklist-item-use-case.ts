import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { PrismaCardChecklistsRepository } from '@/repositories/tasks/prisma/prisma-card-checklists-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { RemoveChecklistItemUseCase } from '../remove-checklist-item';

export function makeRemoveChecklistItemUseCase() {
  const cardChecklistsRepository = new PrismaCardChecklistsRepository();
  const cardsRepository = new PrismaCardsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new RemoveChecklistItemUseCase(
    cardChecklistsRepository,
    cardsRepository,
    cardActivitiesRepository,
  );
}
