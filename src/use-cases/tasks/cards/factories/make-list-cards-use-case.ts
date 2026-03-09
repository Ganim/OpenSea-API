import { PrismaBoardMembersRepository } from '@/repositories/tasks/prisma/prisma-board-members-repository';
import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { ListCardsUseCase } from '../list-cards';

export function makeListCardsUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const cardsRepository = new PrismaCardsRepository();
  const boardMembersRepository = new PrismaBoardMembersRepository();
  return new ListCardsUseCase(boardsRepository, cardsRepository, boardMembersRepository);
}
