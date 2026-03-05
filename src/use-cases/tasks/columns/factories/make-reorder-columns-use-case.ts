import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaBoardColumnsRepository } from '@/repositories/tasks/prisma/prisma-board-columns-repository';
import { ReorderColumnsUseCase } from '../reorder-columns';

export function makeReorderColumnsUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardColumnsRepository = new PrismaBoardColumnsRepository();
  return new ReorderColumnsUseCase(boardsRepository, boardColumnsRepository);
}
