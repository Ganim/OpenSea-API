import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaBoardColumnsRepository } from '@/repositories/tasks/prisma/prisma-board-columns-repository';
import { CreateColumnUseCase } from '../create-column';

export function makeCreateColumnUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardColumnsRepository = new PrismaBoardColumnsRepository();
  return new CreateColumnUseCase(boardsRepository, boardColumnsRepository);
}
