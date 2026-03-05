import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { GetCardUseCase } from '../get-card';

export function makeGetCardUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const cardsRepository = new PrismaCardsRepository();
  return new GetCardUseCase(boardsRepository, cardsRepository);
}
