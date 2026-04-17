import { PrismaOverdueEscalationsRepository } from '@/repositories/finance/prisma/prisma-overdue-escalations-repository';
import { DuplicateOverdueEscalationUseCase } from '../duplicate-overdue-escalation';

export function makeDuplicateOverdueEscalationUseCase() {
  const escalationsRepository = new PrismaOverdueEscalationsRepository();
  return new DuplicateOverdueEscalationUseCase(escalationsRepository);
}
