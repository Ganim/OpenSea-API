import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { DetectDuplicateEntryUseCase } from '../detect-duplicate-entry';

export function makeDetectDuplicateEntryUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();

  return new DetectDuplicateEntryUseCase(entriesRepository);
}
