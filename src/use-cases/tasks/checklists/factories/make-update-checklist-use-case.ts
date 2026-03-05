import { PrismaCardChecklistsRepository } from '@/repositories/tasks/prisma/prisma-card-checklists-repository';
import { UpdateChecklistUseCase } from '../update-checklist';

export function makeUpdateChecklistUseCase() {
  const cardChecklistsRepository = new PrismaCardChecklistsRepository();
  return new UpdateChecklistUseCase(cardChecklistsRepository);
}
