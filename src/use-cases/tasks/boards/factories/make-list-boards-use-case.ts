import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { ListBoardsUseCase } from '../list-boards';

export function makeListBoardsUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  return new ListBoardsUseCase(boardsRepository);
}
