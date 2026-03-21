import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { PrismaCardChecklistsRepository } from '@/repositories/tasks/prisma/prisma-card-checklists-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { AddChecklistItemUseCase } from '../add-checklist-item';

export function makeAddChecklistItemUseCase() {
  const cardChecklistsRepository = new PrismaCardChecklistsRepository();
  const cardsRepository = new PrismaCardsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new AddChecklistItemUseCase(
    cardChecklistsRepository,
    cardsRepository,
    cardActivitiesRepository,
  );
}
