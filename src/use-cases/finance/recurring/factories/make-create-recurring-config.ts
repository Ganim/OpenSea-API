import { PrismaRecurringConfigsRepository } from '@/repositories/finance/prisma/prisma-recurring-configs-repository';
import { CreateRecurringConfigUseCase } from '../create-recurring-config';

export function makeCreateRecurringConfigUseCase() {
  const recurringConfigsRepository = new PrismaRecurringConfigsRepository();
  return new CreateRecurringConfigUseCase(recurringConfigsRepository);
}
