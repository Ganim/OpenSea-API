import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { UpdateBoardUseCase } from '../update-board';

export function makeUpdateBoardUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  return new UpdateBoardUseCase(boardsRepository);
}
