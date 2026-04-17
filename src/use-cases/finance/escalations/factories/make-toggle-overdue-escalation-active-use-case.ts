import { PrismaOverdueEscalationsRepository } from '@/repositories/finance/prisma/prisma-overdue-escalations-repository';
import { ToggleOverdueEscalationActiveUseCase } from '../toggle-overdue-escalation-active';

export function makeToggleOverdueEscalationActiveUseCase() {
  const escalationsRepository = new PrismaOverdueEscalationsRepository();
  return new ToggleOverdueEscalationActiveUseCase(escalationsRepository);
}
