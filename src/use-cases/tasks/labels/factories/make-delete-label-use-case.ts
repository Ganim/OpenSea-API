import { PrismaBoardLabelsRepository } from '@/repositories/tasks/prisma/prisma-board-labels-repository';
import { DeleteLabelUseCase } from '../delete-label';

export function makeDeleteLabelUseCase() {
  const boardLabelsRepository = new PrismaBoardLabelsRepository();
  return new DeleteLabelUseCase(boardLabelsRepository);
}
