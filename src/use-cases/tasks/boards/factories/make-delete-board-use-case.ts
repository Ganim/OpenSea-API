import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { DeleteBoardUseCase } from '../delete-board';

export function makeDeleteBoardUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  return new DeleteBoardUseCase(boardsRepository);
}
