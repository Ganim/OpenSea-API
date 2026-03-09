import { PrismaBoardAutomationsRepository } from '@/repositories/tasks/prisma/prisma-board-automations-repository';
import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { ToggleAutomationUseCase } from '../toggle-automation';

export function makeToggleAutomationUseCase() {
  const boardAutomationsRepository = new PrismaBoardAutomationsRepository();
  const boardsRepository = new PrismaBoardsRepository();
  return new ToggleAutomationUseCase(
    boardAutomationsRepository,
    boardsRepository,
  );
}
