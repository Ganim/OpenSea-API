import { PrismaRecurringConfigsRepository } from '@/repositories/finance/prisma/prisma-recurring-configs-repository';
import { ResumeRecurringUseCase } from '../resume-recurring';

export function makeResumeRecurringUseCase() {
  const recurringConfigsRepository = new PrismaRecurringConfigsRepository();
  return new ResumeRecurringUseCase(recurringConfigsRepository);
}
