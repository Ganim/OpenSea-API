import { PrismaBoardAutomationsRepository } from '@/repositories/tasks/prisma/prisma-board-automations-repository';
import { ToggleAutomationUseCase } from '../toggle-automation';

export function makeToggleAutomationUseCase() {
  const boardAutomationsRepository = new PrismaBoardAutomationsRepository();
  return new ToggleAutomationUseCase(boardAutomationsRepository);
}
