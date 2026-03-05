import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { ArchiveBoardUseCase } from '../archive-board';

export function makeArchiveBoardUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  return new ArchiveBoardUseCase(boardsRepository);
}
