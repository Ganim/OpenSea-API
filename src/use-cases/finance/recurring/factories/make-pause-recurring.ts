import { PrismaRecurringConfigsRepository } from '@/repositories/finance/prisma/prisma-recurring-configs-repository';
import { PauseRecurringUseCase } from '../pause-recurring';

export function makePauseRecurringUseCase() {
  const recurringConfigsRepository = new PrismaRecurringConfigsRepository();
  return new PauseRecurringUseCase(recurringConfigsRepository);
}
