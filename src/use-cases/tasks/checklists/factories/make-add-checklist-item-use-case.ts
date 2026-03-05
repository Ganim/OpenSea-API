import { PrismaCardChecklistsRepository } from '@/repositories/tasks/prisma/prisma-card-checklists-repository';
import { AddChecklistItemUseCase } from '../add-checklist-item';

export function makeAddChecklistItemUseCase() {
  const cardChecklistsRepository = new PrismaCardChecklistsRepository();
  return new AddChecklistItemUseCase(cardChecklistsRepository);
}
