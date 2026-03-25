import { PrismaOverdueEscalationsRepository } from '@/repositories/finance/prisma/prisma-overdue-escalations-repository';
import { CreateOverdueEscalationUseCase } from '../create-overdue-escalation';

export function makeCreateOverdueEscalationUseCase() {
  const escalationsRepository = new PrismaOverdueEscalationsRepository();
  return new CreateOverdueEscalationUseCase(escalationsRepository);
}
