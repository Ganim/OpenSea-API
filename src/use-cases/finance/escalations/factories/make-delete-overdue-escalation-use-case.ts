import { PrismaOverdueEscalationsRepository } from '@/repositories/finance/prisma/prisma-overdue-escalations-repository';
import { DeleteOverdueEscalationUseCase } from '../delete-overdue-escalation';

export function makeDeleteOverdueEscalationUseCase() {
  const escalationsRepository = new PrismaOverdueEscalationsRepository();
  return new DeleteOverdueEscalationUseCase(escalationsRepository);
}
