import { PrismaRecurringConfigsRepository } from '@/repositories/finance/prisma/prisma-recurring-configs-repository';
import { ApplyIndexationUseCase } from '../apply-indexation';

export function makeApplyIndexationUseCase() {
  const recurringConfigsRepository = new PrismaRecurringConfigsRepository();
  return new ApplyIndexationUseCase(recurringConfigsRepository);
}
