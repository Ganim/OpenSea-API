import { PrismaBoardAutomationsRepository } from '@/repositories/tasks/prisma/prisma-board-automations-repository';
import { UpdateAutomationUseCase } from '../update-automation';

export function makeUpdateAutomationUseCase() {
  const boardAutomationsRepository = new PrismaBoardAutomationsRepository();
  return new UpdateAutomationUseCase(boardAutomationsRepository);
}
