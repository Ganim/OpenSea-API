import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaCardChecklistsRepository } from '@/repositories/tasks/prisma/prisma-card-checklists-repository';
import { ListChecklistsUseCase } from '../list-checklists';

export function makeListChecklistsUseCase() {
  const cardsRepository = new PrismaCardsRepository();
  const cardChecklistsRepository = new PrismaCardChecklistsRepository();
  return new ListChecklistsUseCase(cardsRepository, cardChecklistsRepository);
}
