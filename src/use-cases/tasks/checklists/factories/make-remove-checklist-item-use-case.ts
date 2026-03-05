import { PrismaCardChecklistsRepository } from '@/repositories/tasks/prisma/prisma-card-checklists-repository';
import { RemoveChecklistItemUseCase } from '../remove-checklist-item';

export function makeRemoveChecklistItemUseCase() {
  const cardChecklistsRepository = new PrismaCardChecklistsRepository();
  return new RemoveChecklistItemUseCase(cardChecklistsRepository);
}
