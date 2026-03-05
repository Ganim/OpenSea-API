import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { ListSubtasksUseCase } from '../list-subtasks';

export function makeListSubtasksUseCase() {
  const cardsRepository = new PrismaCardsRepository();
  return new ListSubtasksUseCase(cardsRepository);
}
