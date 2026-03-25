import { PrismaOverdueEscalationsRepository } from '@/repositories/finance/prisma/prisma-overdue-escalations-repository';
import { GetOverdueEscalationByIdUseCase } from '../get-overdue-escalation-by-id';

export function makeGetOverdueEscalationByIdUseCase() {
  const escalationsRepository = new PrismaOverdueEscalationsRepository();
  return new GetOverdueEscalationByIdUseCase(escalationsRepository);
}
