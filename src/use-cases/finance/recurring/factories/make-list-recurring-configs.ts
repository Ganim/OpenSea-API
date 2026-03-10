import { PrismaRecurringConfigsRepository } from '@/repositories/finance/prisma/prisma-recurring-configs-repository';
import { ListRecurringConfigsUseCase } from '../list-recurring-configs';

export function makeListRecurringConfigsUseCase() {
  const recurringConfigsRepository = new PrismaRecurringConfigsRepository();
  return new ListRecurringConfigsUseCase(recurringConfigsRepository);
}
