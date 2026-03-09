import { PrismaCardChecklistsRepository } from '@/repositories/tasks/prisma/prisma-card-checklists-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { DeleteChecklistUseCase } from '../delete-checklist';

export function makeDeleteChecklistUseCase() {
  const cardChecklistsRepository = new PrismaCardChecklistsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new DeleteChecklistUseCase(
    cardChecklistsRepository,
    cardActivitiesRepository,
  );
}
