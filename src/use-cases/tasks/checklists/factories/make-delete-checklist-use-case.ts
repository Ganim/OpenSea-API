import { PrismaCardChecklistsRepository } from '@/repositories/tasks/prisma/prisma-card-checklists-repository';
import { DeleteChecklistUseCase } from '../delete-checklist';

export function makeDeleteChecklistUseCase() {
  const cardChecklistsRepository = new PrismaCardChecklistsRepository();
  return new DeleteChecklistUseCase(cardChecklistsRepository);
}
