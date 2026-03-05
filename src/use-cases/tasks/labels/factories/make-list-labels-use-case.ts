import { PrismaBoardLabelsRepository } from '@/repositories/tasks/prisma/prisma-board-labels-repository';
import { ListLabelsUseCase } from '../list-labels';

export function makeListLabelsUseCase() {
  const boardLabelsRepository = new PrismaBoardLabelsRepository();
  return new ListLabelsUseCase(boardLabelsRepository);
}
