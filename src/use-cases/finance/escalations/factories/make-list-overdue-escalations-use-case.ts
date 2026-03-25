import { PrismaOverdueEscalationsRepository } from '@/repositories/finance/prisma/prisma-overdue-escalations-repository';
import { ListOverdueEscalationsUseCase } from '../list-overdue-escalations';

export function makeListOverdueEscalationsUseCase() {
  const escalationsRepository = new PrismaOverdueEscalationsRepository();
  return new ListOverdueEscalationsUseCase(escalationsRepository);
}
