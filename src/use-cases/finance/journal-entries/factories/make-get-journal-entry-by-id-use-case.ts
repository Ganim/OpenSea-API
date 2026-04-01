import { PrismaJournalEntriesRepository } from '@/repositories/finance/prisma/prisma-journal-entries-repository';
import { GetJournalEntryByIdUseCase } from '../get-journal-entry-by-id';

export function makeGetJournalEntryByIdUseCase() {
  const repository = new PrismaJournalEntriesRepository();
  return new GetJournalEntryByIdUseCase(repository);
}
