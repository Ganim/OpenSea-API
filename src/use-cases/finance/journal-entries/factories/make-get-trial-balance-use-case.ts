import { PrismaJournalEntriesRepository } from '@/repositories/finance/prisma/prisma-journal-entries-repository';
import { GetTrialBalanceUseCase } from '../get-trial-balance';

export function makeGetTrialBalanceUseCase() {
  const repository = new PrismaJournalEntriesRepository();
  return new GetTrialBalanceUseCase(repository);
}
