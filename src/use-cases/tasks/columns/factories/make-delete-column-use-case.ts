import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaBoardColumnsRepository } from '@/repositories/tasks/prisma/prisma-board-columns-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { DeleteColumnUseCase } from '../delete-column';

export function makeDeleteColumnUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardColumnsRepository = new PrismaBoardColumnsRepository();
  const cardsRepository = new PrismaCardsRepository();
  return new DeleteColumnUseCase(
    boardsRepository,
    boardColumnsRepository,
    cardsRepository,
  );
}
