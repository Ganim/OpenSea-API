import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaBoardAutomationsRepository } from '@/repositories/tasks/prisma/prisma-board-automations-repository';
import { CreateAutomationUseCase } from '../create-automation';

export function makeCreateAutomationUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardAutomationsRepository = new PrismaBoardAutomationsRepository();
  return new CreateAutomationUseCase(boardsRepository, boardAutomationsRepository);
}
