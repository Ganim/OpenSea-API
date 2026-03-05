import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaBoardColumnsRepository } from '@/repositories/tasks/prisma/prisma-board-columns-repository';
import { UpdateColumnUseCase } from '../update-column';

export function makeUpdateColumnUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardColumnsRepository = new PrismaBoardColumnsRepository();
  return new UpdateColumnUseCase(boardsRepository, boardColumnsRepository);
}
