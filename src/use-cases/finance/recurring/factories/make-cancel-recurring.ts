import { PrismaRecurringConfigsRepository } from '@/repositories/finance/prisma/prisma-recurring-configs-repository';
import { CancelRecurringUseCase } from '../cancel-recurring';

export function makeCancelRecurringUseCase() {
  const recurringConfigsRepository = new PrismaRecurringConfigsRepository();
  return new CancelRecurringUseCase(recurringConfigsRepository);
}
