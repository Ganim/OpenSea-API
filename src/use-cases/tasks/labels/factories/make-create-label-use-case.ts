import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaBoardLabelsRepository } from '@/repositories/tasks/prisma/prisma-board-labels-repository';
import { CreateLabelUseCase } from '../create-label';

export function makeCreateLabelUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardLabelsRepository = new PrismaBoardLabelsRepository();
  return new CreateLabelUseCase(boardsRepository, boardLabelsRepository);
}
