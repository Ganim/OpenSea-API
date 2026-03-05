import { PrismaBoardAutomationsRepository } from '@/repositories/tasks/prisma/prisma-board-automations-repository';
import { ListAutomationsUseCase } from '../list-automations';

export function makeListAutomationsUseCase() {
  const boardAutomationsRepository = new PrismaBoardAutomationsRepository();
  return new ListAutomationsUseCase(boardAutomationsRepository);
}
