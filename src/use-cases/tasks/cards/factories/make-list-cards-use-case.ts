import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { ListCardsUseCase } from '../list-cards';

export function makeListCardsUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const cardsRepository = new PrismaCardsRepository();
  return new ListCardsUseCase(boardsRepository, cardsRepository);
}
