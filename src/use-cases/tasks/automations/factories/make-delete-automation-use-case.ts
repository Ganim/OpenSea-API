import { PrismaBoardAutomationsRepository } from '@/repositories/tasks/prisma/prisma-board-automations-repository';
import { DeleteAutomationUseCase } from '../delete-automation';

export function makeDeleteAutomationUseCase() {
  const boardAutomationsRepository = new PrismaBoardAutomationsRepository();
  return new DeleteAutomationUseCase(boardAutomationsRepository);
}
