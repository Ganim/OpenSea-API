import { PrismaJournalEntriesRepository } from '@/repositories/finance/prisma/prisma-journal-entries-repository';
import { ReverseJournalEntryUseCase } from '../reverse-journal-entry';

export function makeReverseJournalEntryUseCase() {
  const repository = new PrismaJournalEntriesRepository();
  return new ReverseJournalEntryUseCase(repository);
}
