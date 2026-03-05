import { PrismaCardChecklistsRepository } from '@/repositories/tasks/prisma/prisma-card-checklists-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { ToggleChecklistItemUseCase } from '../toggle-checklist-item';

export function makeToggleChecklistItemUseCase() {
  const cardChecklistsRepository = new PrismaCardChecklistsRepository();
  const cardsRepository = new PrismaCardsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new ToggleChecklistItemUseCase(
    cardChecklistsRepository,
    cardsRepository,
    cardActivitiesRepository,
  );
}
