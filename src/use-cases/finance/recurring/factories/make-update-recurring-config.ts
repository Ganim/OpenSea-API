import { PrismaRecurringConfigsRepository } from '@/repositories/finance/prisma/prisma-recurring-configs-repository';
import { UpdateRecurringConfigUseCase } from '../update-recurring-config';

export function makeUpdateRecurringConfigUseCase() {
  const recurringConfigsRepository = new PrismaRecurringConfigsRepository();
  return new UpdateRecurringConfigUseCase(recurringConfigsRepository);
}
