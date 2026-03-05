import { PrismaBoardLabelsRepository } from '@/repositories/tasks/prisma/prisma-board-labels-repository';
import { UpdateLabelUseCase } from '../update-label';

export function makeUpdateLabelUseCase() {
  const boardLabelsRepository = new PrismaBoardLabelsRepository();
  return new UpdateLabelUseCase(boardLabelsRepository);
}
