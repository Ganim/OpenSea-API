import { PrismaOverdueEscalationsRepository } from '@/repositories/finance/prisma/prisma-overdue-escalations-repository';
import { UpdateOverdueEscalationUseCase } from '../update-overdue-escalation';

export function makeUpdateOverdueEscalationUseCase() {
  const escalationsRepository = new PrismaOverdueEscalationsRepository();
  return new UpdateOverdueEscalationUseCase(escalationsRepository);
}
