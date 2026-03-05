import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaBoardColumnsRepository } from '@/repositories/tasks/prisma/prisma-board-columns-repository';
import { CreateBoardUseCase } from '../create-board';

export function makeCreateBoardUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardColumnsRepository = new PrismaBoardColumnsRepository();
  return new CreateBoardUseCase(boardsRepository, boardColumnsRepository);
}
